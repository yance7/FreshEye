"""FreshEye API 冒烟测试

运行方式：cd Y:\\FreshEye\\hf-space && python -m pytest test_app.py -v
或无 pytest 时：python test_app.py
"""
import io
import hashlib
import json
import logging
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from PIL import Image

import pytest

# 延迟导入 app（触发 lifespan 中的模型加载）
from app import app


@pytest.fixture(autouse=True)
def fresh_rate_limiter(monkeypatch):
    """Each test starts a fresh window; the rate-limit test still exercises the real limiter."""
    import app as service
    monkeypatch.setattr(service, '_rate_limiter', service._RateLimiter())


@pytest.fixture(scope="module")
def c():
    """显式以上下文管理器创建 TestClient，保证 lifespan（模型加载）一定执行，
    消除不同 starlette 版本下模块级 TestClient 是否运行 lifespan 的差异。"""
    with TestClient(app) as client:
        yield client


def _make_test_image(format="JPEG", size=(100, 100), color=(80, 120, 160)):
    buf = io.BytesIO()
    Image.new("RGB", size, color).save(buf, format=format)
    buf.seek(0)
    return buf


def _health_metrics(c):
    data = c.get("/health").json()
    return data.get("metrics", {})


def test_health(c):
    """健康检查应返回 200 且包含模型加载状态"""
    resp = c.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["v1_loaded"] is True
    assert data["v2_loaded"] is True
    assert "device" in data


def test_health_reports_per_model_readiness_and_revision(c, monkeypatch):
    import app as service
    monkeypatch.setattr(service, 'v2_model', None)
    resp = c.get('/health')
    data = resp.json()
    assert resp.status_code == 200
    assert data['status'] == 'ok'  # Process liveness remains backward compatible.
    assert data['readiness'] == 'degraded'
    assert data['models']['v1']['status'] == 'ready'
    with open(service.V1_MODEL_PATH, 'rb') as weights:
        assert data['models']['v1']['weights_sha256'] == hashlib.sha256(weights.read()).hexdigest()
    assert data['models']['v2']['status'] == 'unavailable'
    assert data['revision']
    result = c.post('/predict?model_version=v2', files={'file': ('test.jpg', _make_test_image(), 'image/jpeg')})
    assert result.status_code == 503
    assert result.headers['x-fresheye-error'] == 'model_unavailable'


def test_cache_hit_is_visible_without_changing_prediction_contract(c):
    def request():
        return c.post('/predict?model_version=v2', files={'file': ('cache.png', _make_test_image(format='PNG', color=(17, 29, 43)), 'image/png')})
    first = request()
    second = request()
    assert first.status_code == second.status_code == 200
    assert first.headers['x-fresheye-cache'] == 'miss'
    assert second.headers['x-fresheye-cache'] == 'hit'
    assert first.json() == second.json()


def test_prediction_reports_running_revision_and_weight_fingerprint(c, monkeypatch):
    import app as service
    monkeypatch.setenv('FRESHEYE_REVISION', 'test-revision')
    result = c.post('/predict_with_gradcam?model_version=v2', files={'file': ('revision.png', _make_test_image(format='PNG', color=(41, 53, 67)), 'image/png')})
    assert result.status_code == 200
    assert result.headers['x-fresheye-revision'] == 'test-revision'
    assert result.headers['x-fresheye-weights-sha256'] == service._weight_revisions['v2']
    assert 'X-FreshEye-Weights-SHA256' in c.get('/health', headers={'Origin': 'https://fresheye.yance.me'}).headers['access-control-expose-headers']


def test_model_reload_does_not_reuse_previous_cache(c, monkeypatch):
    import app as service
    monkeypatch.setattr(service, 'v1_model', service.v1_model)
    monkeypatch.setattr(service, 'v2_model', service.v2_model)
    monkeypatch.setattr(service, '_weight_revisions', service._weight_revisions.copy())
    monkeypatch.setattr(service, 'load_v1_model', lambda _: object())
    monkeypatch.setattr(service, 'load_v2_model', lambda _: object())
    monkeypatch.setattr(service, '_warmup_model', lambda *_: None)
    monkeypatch.setattr(service, '_weight_sha256', lambda _: 'a' * 64)
    service._prediction_cache.set('old', 'old-result')
    service._gradcam_cache.set('old', 'old-result')
    with TestClient(app):
        assert service._prediction_cache.get('old') is None
        assert service._gradcam_cache.get('old') is None


def test_prediction_request_log_records_failure_without_image_data(c, caplog):
    with caplog.at_level(logging.INFO, logger='app'):
        response = c.post('/predict?model_version=v3', files={'file': ('private.jpg', _make_test_image(), 'image/jpeg')})
    assert response.status_code == 422
    events = [json.loads(record.message) for record in caplog.records if record.message.startswith('{')]
    event = next(item for item in events if item.get('event') == 'prediction_request')
    assert event['status_code'] == 422
    assert event['outcome'] == 'client_error'
    assert event['duration_ms'] >= 0
    assert 'private.jpg' not in json.dumps(event)


def test_inference_log_separates_lock_wait_and_locked_work(c, caplog):
    with caplog.at_level(logging.INFO, logger='app'):
        response = c.post('/predict?model_version=v1', files={'file': ('image.png', _make_test_image(format='PNG', color=(25, 47, 63)), 'image/png')})
    assert response.status_code == 200
    events = [json.loads(record.message) for record in caplog.records if record.message.startswith('{')]
    event = next(item for item in events if item.get('event') == 'inference_lock')
    assert event['queue_wait_ms'] >= 0
    assert event['locked_work_ms'] >= 0


def test_busy_queue_returns_machine_readable_error(c, monkeypatch):
    import app as service
    class BusyLock:
        def acquire(self, timeout):
            return False
    monkeypatch.setattr(service, '_inference_lock', BusyLock())
    response = c.post('/predict?model_version=v1', files={'file': ('image.png', _make_test_image(format='PNG', color=(7, 11, 13)), 'image/png')})
    assert response.status_code == 503
    assert response.headers['x-fresheye-error'] == 'queue_busy'


def test_startup_fails_if_both_models_fail_warmup(c, monkeypatch):
    import app as service
    monkeypatch.setattr(service, 'v1_model', service.v1_model)
    monkeypatch.setattr(service, 'v2_model', service.v2_model)
    monkeypatch.setattr(service, '_weight_revisions', service._weight_revisions.copy())
    monkeypatch.setattr(service, 'load_v1_model', lambda _: object())
    monkeypatch.setattr(service, 'load_v2_model', lambda _: object())
    def fail_warmup(*_):
        raise RuntimeError('warmup failed')
    monkeypatch.setattr(service, '_warmup_model', fail_warmup)
    with pytest.raises(RuntimeError, match='均加载失败'):
        with TestClient(app):
            pass


def test_root(c):
    """根路径应返回服务状态"""
    resp = c.get("/")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "online"
    assert data["service"] == "FreshEye"


def test_cors_allows_live_frontend():
    """默认 CORS 白名单应允许 FreshEye 当前自定义域名。"""
    client = TestClient(app)
    try:
        resp = client.get("/health", headers={"Origin": "https://fresheye.yance.me"})
        assert resp.status_code == 200
        assert resp.headers.get("access-control-allow-origin") == "https://fresheye.yance.me"
        assert 'X-FreshEye-Cache' in resp.headers.get('access-control-expose-headers', '')
    finally:
        client.close()


def test_invalid_model_version(c):
    """无效模型版本应返回 422"""
    buf = _make_test_image()
    resp = c.post(
        "/predict?model_version=v3",
        files={"file": ("test.jpg", buf, "image/jpeg")},
    )
    assert resp.status_code == 422


def test_predict_v2(c):
    """V2 模型预测应返回三分类结果"""
    buf = _make_test_image()
    resp = c.post(
        "/predict?model_version=v2",
        files={"file": ("test.jpg", buf, "image/jpeg")},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["freshness_label"] in [0, 1, 2]
    assert 0.0 <= data["confidence_score"] <= 1.0
    assert len(data["all_probabilities"]) == 3
    assert data["model_version"] == "v2"


def test_predict_v1(c):
    """V1 模型预测必须由 V1 实际完成，不允许静默回退到 V2。"""
    buf = _make_test_image()
    resp = c.post(
        "/predict?model_version=v1",
        files={"file": ("test.jpg", buf, "image/jpeg")},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["freshness_label"] in [0, 1, 2]
    assert data["model_version"] == "v1"


def test_predict_with_gradcam(c):
    """Grad-CAM 端点应返回预测结果，存在有效热力图时返回 base64。"""
    buf = _make_test_image()
    resp = c.post(
        "/predict_with_gradcam?model_version=v2",
        files={"file": ("test.jpg", buf, "image/jpeg")},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "heatmap_image" in data
    assert "prediction" in data
    assert isinstance(data["heatmap_image"], str)
    assert data["prediction"]["freshness_label"] in [0, 1, 2]


@pytest.mark.parametrize("cam_state", ["active", "flat", "failed"])
def test_gradcam_only_displays_available_evidence(c, monkeypatch, cam_state):
    import app as service
    import numpy as np

    def compute_cam(*_):
        if cam_state == "failed":
            raise RuntimeError("Grad-CAM unavailable")
        cam = np.zeros((224, 224), dtype=np.float32)
        if cam_state == "active":
            cam[:112, :] = 1
        return cam

    monkeypatch.setattr(service, "_compute_cam_vectorized", compute_cam)
    color = {"active": (75, 80, 20), "flat": (75, 80, 60), "failed": (75, 80, 100)}
    buf = _make_test_image(size=(160, 90), color=color[cam_state])
    resp = c.post(
        "/predict_with_gradcam?model_version=v2",
        files={"file": ("cam.jpg", buf, "image/jpeg")},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["prediction"]["freshness_label"] in [0, 1, 2]
    if cam_state == "active":
        assert len(data["heatmap_image"]) > 100
    else:
        assert data["heatmap_image"] == ""


def test_gradcam_does_not_accumulate_parameter_gradients(c):
    """Grad-CAM 只需要输入/特征图梯度，不应给模型参数留下梯度缓冲。"""
    buf = _make_test_image(color=(120, 160, 80))
    resp = c.post(
        "/predict_with_gradcam?model_version=v2",
        files={"file": ("gradient-check.jpg", buf, "image/jpeg")},
    )
    assert resp.status_code == 200
    from app import v2_model
    assert all(param.grad is None for param in v2_model.parameters())


def test_invalid_file_format(c):
    """非图片文件应返回 400"""
    resp = c.post(
        "/predict",
        files={"file": ("test.txt", b"not an image", "text/plain")},
    )
    assert resp.status_code == 400


def test_oversized_dimension(c):
    """超大尺寸图片应返回 400（尺寸预校验，不解码即拒绝）"""
    buf = _make_test_image(size=(5000, 5000))
    resp = c.post(
        "/predict",
        files={"file": ("big.jpg", buf, "image/jpeg")},
    )
    assert resp.status_code == 400


def test_png_supported(c):
    """PNG 图片应正常预测"""
    buf = _make_test_image(format="PNG")
    resp = c.post(
        "/predict?model_version=v2",
        files={"file": ("test.png", buf, "image/png")},
    )
    assert resp.status_code == 200


def test_webp_supported(c):
    """WebP 与公开接口说明一致，使用正确 MIME 时应直接支持。"""
    buf = _make_test_image(format="WEBP")
    resp = c.post(
        "/predict?model_version=v2",
        files={"file": ("test.webp", buf, "image/webp")},
    )
    assert resp.status_code == 200


def test_cache_hit(c):
    """相同图片二次请求应真实命中缓存（对比 /health 缓存命中数增量）"""
    buf1 = _make_test_image()
    buf2 = _make_test_image()  # 内容与 buf1 一致 -> 缓存键一致
    before = _health_metrics(c)
    resp1 = c.post(
        "/predict_with_gradcam?model_version=v2",
        files={"file": ("test.jpg", buf1, "image/jpeg")},
    )
    assert resp1.status_code == 200
    resp2 = c.post(
        "/predict_with_gradcam?model_version=v2",
        files={"file": ("test.jpg", buf2, "image/jpeg")},
    )
    assert resp2.status_code == 200
    assert resp2.headers['x-fresheye-cache'] == 'hit'
    after = _health_metrics(c)
    # 结果一致
    assert resp1.json()["prediction"]["freshness_label"] == resp2.json()["prediction"]["freshness_label"]
    # 真实缓存命中：total_requests 增加 2，cache_hits 至少增加 1
    assert after["total_requests"] - before["total_requests"] >= 2
    assert after["cache_hits"] - before["cache_hits"] >= 1


def test_rate_limit(c):
    """同一客户端超过 15 次/分钟应触发 429"""
    statuses = []
    for _ in range(17):
        resp = c.post(
            "/predict?model_version=v2",
            files={"file": ("test.jpg", _make_test_image(), "image/jpeg")},
        )
        statuses.append(resp.status_code)
    assert 429 in statuses, f"期望出现 429，实际状态码: {statuses}"


if __name__ == "__main__":
    # 无 pytest 时直接运行（显式上下文管理器触发 lifespan）
    import traceback

    with TestClient(app) as client:
        tests = [
            test_health, test_root, test_cors_allows_live_frontend, test_invalid_model_version,
            test_predict_v2, test_predict_v1, test_predict_with_gradcam,
            test_invalid_file_format, test_oversized_dimension,
            test_png_supported, test_webp_supported, test_cache_hit, test_rate_limit,
        ]
        passed = 0
        failed = 0
        for test in tests:
            try:
                test(client)
                print(f"  PASS  {test.__name__}")
                passed += 1
            except Exception:
                print(f"  FAIL  {test.__name__}")
                traceback.print_exc()
                failed += 1
        print(f"\n{'='*40}\n结果: {passed} 通过, {failed} 失败")
        sys.exit(1 if failed else 0)
