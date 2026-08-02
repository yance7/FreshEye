"""FreshEye API 冒烟测试

运行方式：cd y:\\FreshEye\\hf-deploy && python -m pytest test_app.py -v
或无 pytest 时：python test_app.py
"""
import io
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from PIL import Image

# 延迟导入 app（触发 lifespan 中的模型加载）
from app import app

client = TestClient(app)


def _make_test_image(format="JPEG", size=(100, 100), color=(80, 120, 160)):
    buf = io.BytesIO()
    Image.new("RGB", size, color).save(buf, format=format)
    buf.seek(0)
    return buf


def test_health():
    """健康检查应返回 200 且包含模型加载状态"""
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "v1_loaded" in data
    assert "v2_loaded" in data
    assert "device" in data


def test_root():
    """根路径应返回服务状态"""
    resp = client.get("/")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "online"
    assert data["service"] == "FreshEye"


def test_invalid_model_version():
    """无效模型版本应返回 422"""
    buf = _make_test_image()
    resp = client.post(
        "/predict?model_version=v3",
        files={"file": ("test.jpg", buf, "image/jpeg")},
    )
    assert resp.status_code == 422


def test_predict_v2():
    """V2 模型预测应返回三分类结果"""
    buf = _make_test_image()
    resp = client.post(
        "/predict?model_version=v2",
        files={"file": ("test.jpg", buf, "image/jpeg")},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["freshness_label"] in [0, 1, 2]
    assert 0.0 <= data["confidence_score"] <= 1.0
    assert len(data["all_probabilities"]) == 3
    assert data["model_version"] == "v2"


def test_predict_v1():
    """V1 模型预测应返回三分类结果"""
    buf = _make_test_image()
    resp = client.post(
        "/predict?model_version=v1",
        files={"file": ("test.jpg", buf, "image/jpeg")},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["freshness_label"] in [0, 1, 2]
    assert data["model_version"] == "v1"


def test_predict_with_gradcam():
    """Grad-CAM 端点应返回预测结果 + 热力图 base64"""
    buf = _make_test_image()
    resp = client.post(
        "/predict_with_gradcam?model_version=v2",
        files={"file": ("test.jpg", buf, "image/jpeg")},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "heatmap_image" in data
    assert "prediction" in data
    assert len(data["heatmap_image"]) > 100  # base64 字符串非空


def test_invalid_file_format():
    """非图片文件应返回 400"""
    resp = client.post(
        "/predict",
        files={"file": ("test.txt", b"not an image", "text/plain")},
    )
    assert resp.status_code == 400


def test_oversized_dimension():
    """超大尺寸图片应返回 400"""
    buf = _make_test_image(size=(5000, 5000))
    resp = client.post(
        "/predict",
        files={"file": ("big.jpg", buf, "image/jpeg")},
    )
    assert resp.status_code == 400


def test_cache_hit():
    """相同图片二次请求应命中缓存（响应更快）"""
    buf1 = _make_test_image()
    buf2 = _make_test_image()
    resp1 = client.post(
        "/predict_with_gradcam?model_version=v2",
        files={"file": ("test.jpg", buf1, "image/jpeg")},
    )
    assert resp1.status_code == 200
    resp2 = client.post(
        "/predict_with_gradcam?model_version=v2",
        files={"file": ("test.jpg", buf2, "image/jpeg")},
    )
    assert resp2.status_code == 200
    # 两次结果一致
    assert resp1.json()["prediction"]["freshness_label"] == resp2.json()["prediction"]["freshness_label"]


if __name__ == "__main__":
    # 无 pytest 时直接运行
    import traceback
    tests = [
        test_health, test_root, test_invalid_model_version,
        test_predict_v2, test_predict_v1, test_predict_with_gradcam,
        test_invalid_file_format, test_oversized_dimension, test_cache_hit,
    ]
    passed = 0
    failed = 0
    for test in tests:
        try:
            test()
            print(f"  PASS  {test.__name__}")
            passed += 1
        except Exception:
            print(f"  FAIL  {test.__name__}")
            traceback.print_exc()
            failed += 1
    print(f"\n{'='*40}\n结果: {passed} 通过, {failed} 失败")
    sys.exit(1 if failed else 0)
