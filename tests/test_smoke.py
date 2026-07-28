"""
FreshEye smoke tests.

These tests verify that the workflow graph imports correctly and that
node input/output schemas are valid. They do NOT require a running LLM
or model service — a stub LLM client is injected for dry-run tests.
"""
import importlib
import sys
from pathlib import Path
from unittest.mock import patch, MagicMock

import pytest

# Ensure src/ is on the path (matches pyproject.toml pythonpath = ["src"])
SRC = Path(__file__).resolve().parent.parent / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))


class TestGraphImport:
    """Verify that the main graph and all nodes import without errors.

    These tests require langgraph/langchain-core to be installed.
    Run with: pip install -r requirements.txt && pytest tests/
    """

    def test_main_graph_imports(self):
        pytest.importorskip("langgraph")
        mod = importlib.import_module("graphs.graph")
        assert hasattr(mod, "main_graph"), "main_graph must be defined"
        assert mod.main_graph is not None

    def test_state_imports(self):
        mod = importlib.import_module("graphs.state")
        for cls_name in [
            "GlobalState", "GraphInput", "GraphOutput",
            "QualityDecisionInput", "ConfidenceDecisionInput",
        ]:
            assert hasattr(mod, cls_name), f"{cls_name} must be defined in state"

    def test_all_node_modules_import(self):
        pytest.importorskip("langgraph")
        pytest.importorskip("langchain_core")
        node_names = [
            "image_upload_node",
            "enhanced_quality_check_node",
            "quality_unqualified_node",
            "image_preprocess_node",
            "fish_region_detection_node",
            "freshness_classification_node",
            "multi_region_fusion_node",
            "backup_model_review_node",
            "low_confidence_prompt_node",
            "enhanced_gradcam_node",
            "structured_analysis_node",
            "temporal_analysis_node",
            "report_generation_node",
            "recommendation_generation_node",
            "result_visualization_node",
            "feedback_loop_node",
        ]
        for name in node_names:
            importlib.import_module(f"graphs.nodes.{name}")


class TestConfigIntegrity:
    """Verify all config JSON files are valid and have required fields."""

    @pytest.mark.parametrize("node_id", [
        "enhanced_quality_check",
        "fish_region_detection",
        "freshness_classification",
        "multi_region_fusion",
        "backup_model_review",
        "enhanced_gradcam",
        "structured_analysis",
        "temporal_analysis",
        "report_generation",
        "recommendation_generation",
    ])
    def test_config_has_required_fields(self, node_id):
        import json
        config_dir = Path(__file__).resolve().parent.parent / "config"
        cfg_path = config_dir / f"{node_id}_llm_cfg.json"
        assert cfg_path.exists(), f"Config file missing: {cfg_path}"
        with open(cfg_path, encoding="utf-8") as f:
            cfg = json.load(f)
        assert "config" in cfg, f"'config' key missing in {cfg_path.name}"
        assert "sp" in cfg, f"'sp' (system prompt) missing in {cfg_path.name}"
        assert "up" in cfg, f"'up' (user prompt template) missing in {cfg_path.name}"


class TestUrlSafety:
    """Verify SSRF protection blocks private/loopback addresses."""

    def test_loopback_blocked(self):
        from utils.net import validate_url
        with pytest.raises(ValueError, match="private|loopback"):
            validate_url("http://127.0.0.1:8000/")

    def test_private_ip_blocked(self):
        from utils.net import validate_url
        with pytest.raises(ValueError, match="private|loopback"):
            validate_url("http://192.168.1.1/test")

    def test_metadata_ip_blocked(self):
        from utils.net import validate_url
        with pytest.raises(ValueError, match="private|loopback"):
            validate_url("http://169.254.169.254/latest/meta-data/")

    def test_invalid_scheme_blocked(self):
        from utils.net import validate_url
        with pytest.raises(ValueError, match="scheme"):
            validate_url("file:///etc/passwd")

    def test_public_url_accepted(self):
        from utils.net import validate_url
        # Should not raise (example.com resolves to a public IP)
        validate_url("https://example.com/image.jpg")


class TestConfidenceDecision:
    """Verify confidence-based branching logic.

    Requires langgraph to be installed.
    """

    def test_high_confidence(self):
        pytest.importorskip("langgraph")
        from graphs.state import ConfidenceDecisionInput
        from graphs.graph import confidence_decision
        state = ConfidenceDecisionInput(confidence_score=0.9)
        assert confidence_decision(state) == "高置信度"

    def test_medium_confidence(self):
        pytest.importorskip("langgraph")
        from graphs.state import ConfidenceDecisionInput
        from graphs.graph import confidence_decision
        state = ConfidenceDecisionInput(confidence_score=0.6)
        assert confidence_decision(state) == "中置信度"

    def test_low_confidence(self):
        pytest.importorskip("langgraph")
        from graphs.state import ConfidenceDecisionInput
        from graphs.graph import confidence_decision
        state = ConfidenceDecisionInput(confidence_score=0.3)
        assert confidence_decision(state) == "低置信度"

    def test_none_confidence(self):
        pytest.importorskip("langgraph")
        from graphs.state import ConfidenceDecisionInput
        from graphs.graph import confidence_decision
        state = ConfidenceDecisionInput(confidence_score=0.0)
        assert confidence_decision(state) == "低置信度"


class TestGetDefaultModel:
    """Verify default model resolution."""

    def test_env_override(self, monkeypatch):
        monkeypatch.setenv("FISH_AGENT_DEFAULT_MODEL", "test-model-123")
        from graphs.utils import get_default_model
        assert get_default_model() == "test-model-123"

    def test_no_env_returns_empty(self, monkeypatch):
        monkeypatch.delenv("FISH_AGENT_DEFAULT_MODEL", raising=False)
        from graphs.utils import get_default_model
        assert get_default_model() == ""
