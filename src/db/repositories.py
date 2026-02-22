import uuid
from datetime import datetime, timezone

from pgvector.sqlalchemy import Vector
from sqlalchemy import cast, func, select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from .models import (
    AnalysisResult,
    Consultation,
    ConsultationInput,
    ConsultationStatus,
    ConsultationType,
    Doctor,
    InputType,
    Patient,
)


# ── Doctor ──


async def create_doctor(session: AsyncSession, *, name: str, specialization: str | None = None) -> Doctor:
    doctor = Doctor(name=name, specialization=specialization)
    session.add(doctor)
    await session.commit()
    await session.refresh(doctor)
    return doctor


async def get_doctor(session: AsyncSession, doctor_id: uuid.UUID) -> Doctor | None:
    return await session.get(Doctor, doctor_id)


# ── Patient ──


async def create_patient(
    session: AsyncSession,
    *,
    name: str,
    date_of_birth: datetime | None = None,
    medical_record_number: str | None = None,
) -> Patient:
    patient = Patient(name=name, date_of_birth=date_of_birth, medical_record_number=medical_record_number)
    session.add(patient)
    await session.commit()
    await session.refresh(patient)
    return patient


async def get_patient(session: AsyncSession, patient_id: uuid.UUID) -> Patient | None:
    return await session.get(Patient, patient_id)


# ── Consultation ──


async def create_consultation(
    session: AsyncSession,
    *,
    doctor_id: uuid.UUID,
    patient_id: uuid.UUID,
    consultation_type: ConsultationType,
) -> Consultation:
    consultation = Consultation(
        doctor_id=doctor_id,
        patient_id=patient_id,
        consultation_type=consultation_type,
    )
    session.add(consultation)
    await session.commit()
    await session.refresh(consultation)
    return consultation


async def get_consultation(session: AsyncSession, consultation_id: uuid.UUID) -> Consultation | None:
    stmt = (
        select(Consultation)
        .options(selectinload(Consultation.inputs), selectinload(Consultation.analysis_results))
        .where(Consultation.id == consultation_id)
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def list_consultations(
    session: AsyncSession,
    *,
    doctor_id: uuid.UUID | None = None,
    patient_id: uuid.UUID | None = None,
    status: ConsultationStatus | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[Consultation]:
    stmt = select(Consultation).order_by(Consultation.started_at.desc()).limit(limit).offset(offset)
    if doctor_id:
        stmt = stmt.where(Consultation.doctor_id == doctor_id)
    if patient_id:
        stmt = stmt.where(Consultation.patient_id == patient_id)
    if status:
        stmt = stmt.where(Consultation.status == status)
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def end_consultation(
    session: AsyncSession, consultation_id: uuid.UUID, *, summary: str | None = None
) -> Consultation | None:
    consultation = await get_consultation(session, consultation_id)
    if consultation is None:
        return None
    consultation.status = ConsultationStatus.COMPLETED
    consultation.ended_at = datetime.now(timezone.utc)
    if summary:
        consultation.summary = summary
        consultation.search_vector = func.to_tsvector("english", summary)
    await session.commit()
    await session.refresh(consultation)
    return consultation


# ── Consultation Inputs ──


async def add_input(
    session: AsyncSession,
    *,
    consultation_id: uuid.UUID,
    input_type: InputType,
    file_path: str | None = None,
    raw_text: str | None = None,
) -> ConsultationInput:
    inp = ConsultationInput(
        consultation_id=consultation_id,
        input_type=input_type,
        file_path=file_path,
        raw_text=raw_text,
    )
    session.add(inp)
    await session.commit()
    await session.refresh(inp)
    return inp


# ── Analysis Results ──


async def save_analysis(
    session: AsyncSession,
    *,
    consultation_id: uuid.UUID,
    prompt: str,
    result: dict,
    input_id: uuid.UUID | None = None,
    embedding: list[float] | None = None,
) -> AnalysisResult:
    ar = AnalysisResult(
        consultation_id=consultation_id,
        input_id=input_id,
        prompt=prompt,
        result=result,
        embedding=embedding,
    )
    session.add(ar)
    await session.commit()
    await session.refresh(ar)
    return ar


# ── Search ──


async def fulltext_search(session: AsyncSession, query: str, *, limit: int = 20) -> list[Consultation]:
    ts_query = func.plainto_tsquery("english", query)
    stmt = (
        select(Consultation)
        .where(Consultation.search_vector.op("@@")(ts_query))
        .order_by(func.ts_rank(Consultation.search_vector, ts_query).desc())
        .limit(limit)
    )
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def semantic_search(
    session: AsyncSession, query_embedding: list[float], *, limit: int = 10
) -> list[AnalysisResult]:
    distance = AnalysisResult.embedding.cosine_distance(query_embedding)
    stmt = (
        select(AnalysisResult)
        .where(AnalysisResult.embedding.isnot(None))
        .order_by(distance)
        .limit(limit)
    )
    result = await session.execute(stmt)
    return list(result.scalars().all())
