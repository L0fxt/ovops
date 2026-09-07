from typing import Dict, Any, List, Optional
from ovops.agent.registry import tool
from ovops.rag.vector_store import vector_knowledge_store

@tool
def search_maintenance_sop(query: str, equipment_category: str = "离心泵") -> List[Dict[str, Any]]:
    """检索永嘉泵阀专家规程库：通过向量与混合语义检索匹配永嘉流体装备行业权威维保处置 SOP。
    从磁盘专业 SOP 文档库中执行 Dense Vector 余弦相似度 + BM25 稀疏混合重排序。
    Args:
        query: 检索关键词或故障现象描述，如 '气蚀' 或 '阀杆卡阻'
        equipment_category: 设备品类 ('离心泵' 或 '控制阀')
    """
    results = vector_knowledge_store.search(
        query=query,
        category=equipment_category,
        top_k=2
    )

    matches = []
    for r in results:
        matches.append({
            "sop_id": r["sop_id"],
            "title": r["title"],
            "source": r["source"],
            "steps": r["steps"],
            "score": r["score"],
            "category": r["category"]
        })

    # 若无匹配结果，做一次全库保底 Top 1
    if not matches:
        fallback_results = vector_knowledge_store.search(query=query, top_k=1)
        for r in fallback_results:
            matches.append({
                "sop_id": r["sop_id"],
                "title": r["title"],
                "source": r["source"],
                "steps": r["steps"],
                "score": r["score"],
                "category": r["category"]
            })

    return matches
