"""FreshEye API 冒烟测试

运行方式：cd y:\\FreshEye\\hf-deploy && python -m pytest test_app.py -v
或无 pytest 时：python test_app.py
"""
import io
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from PIL import Image

import pytest

# 延迟导入 app（触发 lifespan 中的模型加载）
from app import app


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
    assert "v1_loaded" in data
    assert "v2_loaded" in data
    assert "device" in data


def test_root(c):
    """根路径应返回服务状态"""
    resp = c.get("/")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "online"
    assert data["service"] == "FreshEye"


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
    """V1 模型预测应返回三分类结果（V1 权重缺失时允许降级到 V2 并跳过）"""
    health = c.get("/health").json()
    if not health.get("v1_loaded"):
        # 部署环境未提供 V1 权重时跳过该断言（get_model 会降级到 V2）
        resp = c.post(
            "/predict?model_version=v1",
            files={"file": ("test.jpg", _make_test_image(), "image/jpeg")},
        )
        assert resp.status_code == 200
        return
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
    """Grad-CAM 端点应返回预测结果 + 热力图 base64"""
    buf = _make_test_image()
    resp = c.post(
        "/predict_with_gradcam?model_version=v2",
        files={"file": ("test.jpg", buf, "image/jpeg")},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "heatmap_image" in data
    assert "prediction" in data
    assert len(data["heatmap_image"]) > 100  # base64 字符串非空


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
            test_health, test_root, test_invalid_model_version,
            test_predict_v2, test_predict_v1, test_predict_with_gradcam,
            test_invalid_file_format, test_oversized_dimension,
            test_png_supported, test_cache_hit, test_rate_limit,
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
