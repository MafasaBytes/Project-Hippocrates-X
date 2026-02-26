import uuid
from datetime import datetime, timezone

from pgvector.sqlalchemy import Vector
from sqlalchemy import cast, func, select, text, union_all, literal_column
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from .models import (
    AnalysisResult,
    Consultation,
    ConsultationInput,
    ConsultationStatus,
    ConsultationType,
    Doctor,
    FollowUp,
    FollowUpStatus,
    FollowUpType,
    InputType,
    MedicalRecord,
    Patient,
    RecordType,
)


# Doctor
async def create_doctor(session: AsyncSession, *, name: str, specialization: str | None = None) -> Doctor:
    doctor = Doctor(name=name, specialization=specialization)
    session.add(doctor)
    await session.commit()
    await session.refresh(doctor)
    return doctor


async def get_doctor(session: AsyncSession, doctor_id: uuid.UUID) -> Doctor | None:
    return await session.get(Doctor, doctor_id)


async def list_doctors(session: AsyncSession, *, limit: int = 50, offset: int = 0) -> list[Doctor]:
    stmt = select(Doctor).order_by(Doctor.name).limit(limit).offset(offset)
    result = await session.execute(stmt)
    return list(result.scalars().all())


# Patient
async def create_patient(session: AsyncSession, **fields) -> Patient:
    patient = Patient(**fields)
    session.add(patient)
    await session.commit()
    await session.refresh(patient)
    return patient


async def update_patient(
    session: AsyncSession, patient_id: uuid.UUID, **fields
) -> Patient | None:
    patient = await session.get(Patient, patient_id)
    if patient is None:
        return None
    for key, value in fields.items():
        setattr(patient, key, value)
    await session.commit()
    await session.refresh(patient)
    return patient


async def get_patient(session: AsyncSession, patient_id: uuid.UUID) -> Patient | None:
    return await session.get(Patient, patient_id)


async def list_patients(session: AsyncSession, *, limit: int = 50, offset: int = 0) -> list[Patient]:
    stmt = select(Patient).order_by(Patient.name).limit(limit).offset(offset)
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def search_patients(session: AsyncSession, query: str, *, limit: int = 20) -> list[Patient]:
    pattern = f"%{query}%"
    stmt = (
        select(Patient)
        .where(
            Patient.name.ilike(pattern) | Patient.medical_record_number.ilike(pattern)
        )
        .order_by(Patient.name)
        .limit(limit)
    )
    result = await session.execute(stmt)
    return list(result.scalars().all())


# Consultation
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


# Consultation Inputs
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


# Analysis Results
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

# Search 
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


# Medical Records
async def create_medical_record(session: AsyncSession, **fields) -> MedicalRecord:
    record = MedicalRecord(**fields)
    session.add(record)
    await session.commit()
    await session.refresh(record)
    return record


async def get_medical_record(session: AsyncSession, record_id: uuid.UUID) -> MedicalRecord | None:
    return await session.get(MedicalRecord, record_id)


async def list_medical_records(
    session: AsyncSession,
    patient_id: uuid.UUID,
    *,
    record_type: RecordType | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[MedicalRecord]:
    stmt = (
        select(MedicalRecord)
        .where(MedicalRecord.patient_id == patient_id)
        .order_by(MedicalRecord.record_date.desc())
        .limit(limit)
        .offset(offset)
    )
    if record_type:
        stmt = stmt.where(MedicalRecord.record_type == record_type)
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def delete_medical_record(session: AsyncSession, record_id: uuid.UUID) -> bool:
    record = await session.get(MedicalRecord, record_id)
    if record is None:
        return False
    await session.delete(record)
    await session.commit()
    return True


# Patient Timeline
async def get_patient_timeline(
    session: AsyncSession,
    patient_id: uuid.UUID,
    *,
    limit: int = 50,
) -> list[dict]:
    """Return a unified, date-sorted timeline of consultations and medical records."""
    consultations_q = (
        select(
            Consultation.id.label("id"),
            Consultation.started_at.label("date"),
            Consultation.summary.label("title"),
            Consultation.status.label("status"),
            Consultation.consultation_type.label("consultation_type"),
        )
        .where(Consultation.patient_id == patient_id)
    )
    cons_rows = await session.execute(consultations_q.order_by(Consultation.started_at.desc()).limit(limit))
    consultations = cons_rows.all()

    records_q = (
        select(
            MedicalRecord.id.label("id"),
            MedicalRecord.record_date.label("date"),
            MedicalRecord.title.label("title"),
            MedicalRecord.record_type.label("record_type"),
            MedicalRecord.description.label("description"),
        )
        .where(MedicalRecord.patient_id == patient_id)
    )
    rec_rows = await session.execute(records_q.order_by(MedicalRecord.record_date.desc()).limit(limit))
    records = rec_rows.all()

    timeline: list[dict] = []
    for c in consultations:
        timeline.append({
            "entry_type": "consultation",
            "id": c.id,
            "date": c.date,
            "title": c.title or "Consultation",
            "status": c.status.value if hasattr(c.status, "value") else str(c.status),
            "consultation_type": c.consultation_type.value if hasattr(c.consultation_type, "value") else str(c.consultation_type),
            "summary": c.title,
        })
    for r in records:
        timeline.append({
            "entry_type": "medical_record",
            "id": r.id,
            "date": r.date,
            "title": r.title,
            "record_type": r.record_type.value if hasattr(r.record_type, "value") else str(r.record_type),
            "description": r.description,
        })

    timeline.sort(key=lambda x: x["date"], reverse=True)
    return timeline[:limit]


async def get_patient_analysis_details(
    session: AsyncSession, patient_id: uuid.UUID, *, limit: int = 30
) -> list[dict]:
    """Retrieve detailed analysis results across all consultations for a patient."""
    stmt = (
        select(AnalysisResult)
        .join(Consultation, AnalysisResult.consultation_id == Consultation.id)
        .where(Consultation.patient_id == patient_id)
        .order_by(AnalysisResult.created_at.desc())
        .limit(limit)
    )
    result = await session.execute(stmt)
    rows = list(result.scalars().all())
    return [
        {
            "prompt": r.prompt,
            "response": r.result.get("response", "") if isinstance(r.result, dict) else "",
            "model": r.result.get("model", "") if isinstance(r.result, dict) else "",
            "created_at": r.created_at.isoformat() if r.created_at else "",
        }
        for r in rows
    ]


async def get_patient_history_summary(
    session: AsyncSession, patient_id: uuid.UUID, *, max_consultations: int = 10
) -> dict:
    """Build a patient history summary suitable for AI context injection."""
    patient = await session.get(Patient, patient_id)
    if patient is None:
        return {}

    cons_stmt = (
        select(Consultation)
        .where(Consultation.patient_id == patient_id, Consultation.status == ConsultationStatus.COMPLETED)
        .order_by(Consultation.started_at.desc())
        .limit(max_consultations)
    )
    cons_result = await session.execute(cons_stmt)
    consultations = list(cons_result.scalars().all())

    rec_stmt = (
        select(MedicalRecord)
        .where(MedicalRecord.patient_id == patient_id)
        .order_by(MedicalRecord.record_date.desc())
        .limit(20)
    )
    rec_result = await session.execute(rec_stmt)
    records = list(rec_result.scalars().all())

    return {
        "patient_name": patient.name,
        "date_of_birth": patient.date_of_birth.isoformat() if patient.date_of_birth else None,
        "gender": patient.gender.value if patient.gender else None,
        "blood_type": patient.blood_type,
        "allergies": patient.allergies or [],
        "chronic_conditions": patient.chronic_conditions or [],
        "consultation_summaries": [
            {
                "date": c.started_at.isoformat(),
                "type": c.consultation_type.value,
                "summary": c.summary or "",
            }
            for c in consultations if c.summary
        ],
        "medical_records": [
            {
                "date": r.record_date.isoformat(),
                "type": r.record_type.value,
                "title": r.title,
                "description": r.description or "",
            }
            for r in records
        ],
    }


# Follow-Ups
async def create_follow_up(session: AsyncSession, **fields) -> FollowUp:
    follow_up = FollowUp(**fields)
    session.add(follow_up)
    await session.commit()
    await session.refresh(follow_up)
    return follow_up


async def get_follow_up(session: AsyncSession, follow_up_id: uuid.UUID) -> FollowUp | None:
    return await session.get(FollowUp, follow_up_id)


async def list_follow_ups(
    session: AsyncSession,
    *,
    doctor_id: uuid.UUID | None = None,
    patient_id: uuid.UUID | None = None,
    status: FollowUpStatus | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[FollowUp]:
    stmt = select(FollowUp).order_by(FollowUp.due_date.asc()).limit(limit).offset(offset)
    if doctor_id:
        stmt = stmt.where(FollowUp.doctor_id == doctor_id)
    if patient_id:
        stmt = stmt.where(FollowUp.patient_id == patient_id)
    if status:
        stmt = stmt.where(FollowUp.status == status)
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def update_follow_up(
    session: AsyncSession, follow_up_id: uuid.UUID, **fields
) -> FollowUp | None:
    follow_up = await session.get(FollowUp, follow_up_id)
    if follow_up is None:
        return None
    for key, value in fields.items():
        setattr(follow_up, key, value)
    await session.commit()
    await session.refresh(follow_up)
    return follow_up


async def mark_overdue_follow_ups(session: AsyncSession) -> int:
    """Mark all pending follow-ups past their due date as overdue. Returns count."""
    now = datetime.now(timezone.utc)
    stmt = (
        select(FollowUp)
        .where(FollowUp.status == FollowUpStatus.PENDING, FollowUp.due_date < now)
    )
    result = await session.execute(stmt)
    overdue = list(result.scalars().all())
    for fu in overdue:
        fu.status = FollowUpStatus.OVERDUE
    if overdue:
        await session.commit()
    return len(overdue)
