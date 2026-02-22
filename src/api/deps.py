"""FastAPI dependency injection for DB sessions and shared services."""

from __future__ import annotations

from collections.abc import AsyncGenerator
from functools import lru_cache

from sqlalchemy.ext.asyncio import AsyncSession

from src.db.engine import get_session
from src.services.consultation import ConsultationService
from src.services.fusion import FusionOrchestrator


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async for session in get_session():
        yield session


@lru_cache(maxsize=1)
def get_fusion() -> FusionOrchestrator:
    return FusionOrchestrator()


def get_consultation_service() -> ConsultationService:
    return ConsultationService(fusion=get_fusion())
