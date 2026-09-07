import os
import re
import math
import time
import numpy as np
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
from config.settings import settings

class KnowledgeChunk:
    """SOP 知识规程分块数据结构"""
    def __init__(
        self,
        doc_id: str,
        category: str,
        title: str,
        source: str,
        keywords: List[str],
        equipment_pattern: str,
        steps: List[str],
        raw_content: str,
        file_path: str,
        version: str = "1.0.0"
    ):
        self.doc_id = doc_id
        self.category = category
        self.title = title
        self.source = source
        self.keywords = keywords
        self.equipment_pattern = equipment_pattern
        self.steps = steps
        self.raw_content = raw_content
        self.file_path = file_path
        self.version = version
        self.vector: Optional[np.ndarray] = None

class VectorKnowledgeStore:
    """
    轻量嵌入式工业 RAG 向量知识检索引擎 (Phase 9)
    基于 NumPy 稠密向量空间 + BM25 稀疏词频混合检索模型
    零额外重型数据库依赖，毫秒级冷启动，支持企业 SOP 规程自动切分与向量索引
    """

    DIM = 128 # 稠密特征向量维度

    def __init__(self, sops_dir: Optional[Path] = None):
        self.sops_dir = sops_dir or (settings.BASE_DIR / "data" / "knowledge" / "sops")
        self.chunks: List[KnowledgeChunk] = []
        self.idf_map: Dict[str, float] = {}
        self.last_indexed_time: Optional[str] = None
        self.reindex()

    def _tokenize(self, text: str) -> List[str]:
        """工业文本简易多字切分与中英文分词器"""
        clean_text = re.sub(r'[^\w\u4e00-\u9fa5]', ' ', text.lower())
        tokens = []
        # 英文/数字词
        for word in clean_text.split():
            if len(word) >= 2:
                tokens.append(word)
        # 中文 2-gram 与 3-gram 切分
        chinese_chars = re.findall(r'[\u4e00-\u9fa5]', text)
        for i in range(len(chinese_chars) - 1):
            tokens.append("".join(chinese_chars[i:i+2]))
            if i < len(chinese_chars) - 2:
                tokens.append("".join(chinese_chars[i:i+3]))
        return tokens

    def _embed_text(self, text: str) -> np.ndarray:
        """
        确定性工业语义稠密向量投影算子 (128维)
        结合 Term Frequency + Hashing Trick + L2 正则化
        """
        vec = np.zeros(self.DIM, dtype=np.float32)
        tokens = self._tokenize(text)
        if not tokens:
            return vec

        for t in tokens:
            # 双重哈希降低特征碰撞
            idx1 = hash(t) % self.DIM
            idx2 = (hash(t[::-1]) ^ 0x5bf03635) % self.DIM
            weight = self.idf_map.get(t, 1.0)
            vec[idx1] += weight
            vec[idx2] += 0.5 * weight

        # L2 模长单位归一化
        norm = np.linalg.norm(vec)
        if norm > 1e-6:
            vec = vec / norm
        return vec

    def _parse_frontmatter(self, content: str) -> Tuple[Dict[str, Any], str]:
        """解析 Markdown 文件头部的 YAML 格式 Frontmatter"""
        import yaml
        if content.startswith("---"):
            parts = content.split("---", 2)
            if len(parts) >= 3:
                try:
                    fm = yaml.safe_load(parts[1]) or {}
                    body = parts[2].strip()
                    return fm, body
                except Exception:
                    pass
        # 兼容无 yaml 库时的基础正则解析
        fm = {}
        body = content
        if content.startswith("---"):
            match = re.match(r"^---\n(.*?)\n---\n(.*)$", content, re.DOTALL)
            if match:
                fm_text, body = match.groups()
                for line in fm_text.split("\n"):
                    if ":" in line:
                        k, v = line.split(":", 1)
                        k = k.strip()
                        v = v.strip().strip('"').strip("'")
                        if v.startswith("[") and v.endswith("]"):
                            fm[k] = [x.strip().strip('"').strip("'") for x in v[1:-1].split(",") if x.strip()]
                        else:
                            fm[k] = v
        return fm, body

    def reindex(self):
        """扫描知识规程目录，重新解析切片并构建向量特征索引"""
        t0 = time.time()
        self.chunks = []
        if not self.sops_dir.exists():
            self.sops_dir.mkdir(parents=True, exist_ok=True)

        # 1. 扫描所有 .md 文件
        all_docs = []
        md_files = list(self.sops_dir.glob("*.md")) + list(self.sops_dir.glob("*.txt"))
        
        doc_term_freqs = []
        corpus_terms = set()

        for fpath in md_files:
            try:
                content = fpath.read_text(encoding="utf-8")
                fm, body = self._parse_frontmatter(content)

                # 提取步骤
                steps = []
                for line in body.split("\n"):
                    line_clean = line.strip()
                    if line_clean.startswith("- 【Step") or line_clean.startswith("【Step"):
                        steps.append(line_clean.lstrip("- ").strip())
                    elif re.match(r"^\d+\.\s+【Step", line_clean):
                        steps.append(re.sub(r"^\d+\.\s+", "", line_clean))

                if not steps:
                    # 保底按换行段落切分
                    steps = [p.strip() for p in body.split("\n\n") if len(p.strip()) > 20][:4]

                kw = fm.get("keywords", [])
                if isinstance(kw, str):
                    kw = [k.strip() for k in kw.split(",") if k.strip()]

                chunk = KnowledgeChunk(
                    doc_id=str(fm.get("id") or fpath.stem),
                    category=str(fm.get("category") or "通用"),
                    title=str(fm.get("title") or fpath.stem),
                    source=str(fm.get("source") or "永嘉工业技术专家委员会"),
                    keywords=kw,
                    equipment_pattern=str(fm.get("equipment_pattern") or "ALL"),
                    steps=steps,
                    raw_content=body,
                    file_path=str(fpath),
                    version=str(fm.get("version") or "1.0.0")
                )
                self.chunks.append(chunk)

                # 词频统计
                terms = self._tokenize(chunk.title + " " + " ".join(chunk.keywords) + " " + chunk.raw_content)
                corpus_terms.update(terms)
                doc_term_freqs.append(set(terms))
            except Exception as e:
                print(f"[RAG] 解析知识文档失败 {fpath}: {e}")

        # 2. 计算 IDF 矩阵
        num_docs = len(self.chunks)
        self.idf_map = {}
        if num_docs > 0:
            for term in corpus_terms:
                doc_count = sum(1 for terms in doc_term_freqs if term in terms)
                self.idf_map[term] = math.log((num_docs + 1.0) / (doc_count + 1.0)) + 1.0

        # 3. 批量向量化
        for chunk in self.chunks:
            full_text = f"{chunk.title} {' '.join(chunk.keywords)} {chunk.raw_content[:500]}"
            chunk.vector = self._embed_text(full_text)

        self.last_indexed_time = time.strftime("%Y-%m-%d %H:%M:%S")
        return len(self.chunks)

    def search(
        self,
        query: str,
        category: Optional[str] = None,
        top_k: int = 3
    ) -> List[Dict[str, Any]]:
        """
        混合语义与关键词相似度检索 (Hybrid Dense + Sparse Rerank)
        Args:
            query: 检索关键词或故障描述语句（如 '离心泵气蚀与吸入压力骤降'）
            category: 可选品类过滤 ('离心泵' 或 '控制阀')
            top_k: 返回最匹配的规程条数
        """
        if not self.chunks:
            return []

        query_vec = self._embed_text(query)
        query_tokens = set(self._tokenize(query))

        candidates = []
        for chunk in self.chunks:
            # 品类过滤
            if category and chunk.category and chunk.category != category:
                # 若完全不匹配且并非通用规程，降低权重或跳过
                if chunk.category != "通用":
                    continue

            # 1. 稠密余弦相似度
            dense_sim = 0.0
            if chunk.vector is not None and np.linalg.norm(query_vec) > 0:
                dense_sim = float(np.dot(query_vec, chunk.vector))

            # 2. 关键词稀疏匹配得分
            sparse_score = 0.0
            chunk_tokens = set(self._tokenize(chunk.title + " " + " ".join(chunk.keywords)))
            overlap = query_tokens.intersection(chunk_tokens)
            if overlap:
                sparse_score = sum(self.idf_map.get(t, 1.0) for t in overlap) / (len(query_tokens) + 1.0)

            # 关键词强匹配加权
            for kw in chunk.keywords:
                if kw in query:
                    sparse_score += 1.5

            # 3. 混合综合得分 (Hybrid Score)
            hybrid_score = round(0.55 * dense_sim + 0.45 * min(1.0, sparse_score), 4)

            candidates.append({
                "sop_id": chunk.doc_id,
                "category": chunk.category,
                "title": chunk.title,
                "source": chunk.source,
                "keywords": chunk.keywords,
                "equipment_pattern": chunk.equipment_pattern,
                "steps": chunk.steps,
                "score": hybrid_score,
                "version": chunk.version,
                "file_path": chunk.file_path
            })

        # 按得分从高到低排序
        candidates.sort(key=lambda x: x["score"], reverse=True)
        return candidates[:top_k]

    def list_documents(self) -> List[Dict[str, Any]]:
        """获取已加载并建立向量索引的规程清单"""
        return [
            {
                "doc_id": c.doc_id,
                "category": c.category,
                "title": c.title,
                "source": c.source,
                "equipment_pattern": c.equipment_pattern,
                "step_count": len(c.steps),
                "version": c.version,
                "file_name": Path(c.file_path).name,
                "keywords": c.keywords
            }
            for c in self.chunks
        ]

# 全局单例
vector_knowledge_store = VectorKnowledgeStore()
