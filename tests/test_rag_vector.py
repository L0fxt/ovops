import pytest
from ovops.rag import vector_knowledge_store, VectorKnowledgeStore
from ovops.tools.rag_tools import search_maintenance_sop

def test_vector_store_loaded_chunks():
    """验证知识库正确解析了 Markdown SOP 文档"""
    assert len(vector_knowledge_store.chunks) >= 4
    doc_ids = [c.doc_id for c in vector_knowledge_store.chunks]
    assert "KB-PUMP-001" in doc_ids
    assert "KB-VALVE-002" in doc_ids
    assert "KB-PUMP-003" in doc_ids
    assert "KB-VALVE-004" in doc_ids

def test_vector_store_search_cavitation():
    """验证气蚀与吸入异常混合检索匹配"""
    results = vector_knowledge_store.search("泵气蚀严重，入口压力急剧下降，泵体有异响", top_k=2)
    assert len(results) > 0
    top_result = results[0]
    assert top_result["sop_id"] == "KB-PUMP-001"
    assert "气蚀" in top_result["title"]
    assert top_result["score"] > 0.3
    assert len(top_result["steps"]) >= 4

def test_vector_store_search_valve_hysteresis():
    """验证阀门卡阻迟滞规程匹配"""
    results = vector_knowledge_store.search("控制阀回差超标 阀杆卡阻 迟滞死区偏大", top_k=2)
    assert len(results) > 0
    top_result = results[0]
    assert top_result["sop_id"] == "KB-VALVE-002"
    assert "卡阻" in top_result["title"] or "迟滞" in top_result["title"]

def test_vector_store_category_filtering():
    """验证设备品类过滤"""
    # 强制指定离心泵品类
    pump_results = vector_knowledge_store.search("高频振动与摩擦", category="离心泵")
    assert all(r["category"] in ["离心泵", "通用"] for r in pump_results)

    # 强制指定控制阀品类
    valve_results = vector_knowledge_store.search("超声波内漏与研磨", category="控制阀")
    assert all(r["category"] in ["控制阀", "通用"] for r in valve_results)
    assert any(r["sop_id"] == "KB-VALVE-004" for r in valve_results)

def test_rag_tool_integration():
    """验证 ovops.tools.rag_tools 包装函数能够与向量检索无缝对接"""
    matches = search_maintenance_sop("气蚀安全裕度不足", equipment_category="离心泵")
    assert len(matches) > 0
    assert "KB-PUMP-001" in [sop["sop_id"] for sop in matches]
    assert len(matches[0]["steps"]) > 0

def test_reindex():
    """验证重新构建向量索引流程"""
    cnt = vector_knowledge_store.reindex()
    assert cnt >= 4
    assert vector_knowledge_store.last_indexed_time is not None
