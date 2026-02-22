"""Full-text and semantic search endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import get_db, get_fusion
from src.api.schemas import AnalysisSearchResultOut, SearchResultOut, SemanticSearchRequest
from src.db import repositories as repo
from src.services.fusion import FusionOrchestrator

router = APIRouter(prefix="/api/search", tags=["search"])


@router.get("", response_model=list[SearchResultOut])
async def fulltext_search(
    q: str = Query(..., min_length=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Full-text search across consultation summaries."""
    consultations = await repo.fulltext_search(db, q, limit=limit)
    return [
        SearchResultOut(
            consultation_id=str(c.id),
            summary=c.summary,
            started_at=c.started_at,
        )
        for c in consultations
    ]


@router.post("/semantic", response_model=list[AnalysisSearchResultOut])
async def semantic_search(
    body: SemanticSearchRequest,
    db: AsyncSession = Depends(get_db),
    fusion: FusionOrchestrator = Depends(get_fusion),
):
    """Semantic similarity search across analysis results using embeddings."""
    query_embedding = fusion.nlp.get_embedding(body.query)
    results = await repo.semantic_search(db, query_embedding, limit=body.limit)
    return [
        AnalysisSearchResultOut(
            analysis_id=str(r.id),
            consultation_id=str(r.consultation_id),
            prompt=r.prompt,
            result=r.result,
            created_at=r.created_at,
        )
        for r in results
    ]
