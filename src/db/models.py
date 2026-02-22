import enum
import uuid
from datetime import datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    DateTime,
    Enum,
    ForeignKey,
    Index,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, TSVECTOR, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


# ── Enums ──


class ConsultationType(str, enum.Enum):
    FACE_TO_FACE = "face_to_face"
    PHONE_CALL = "phone_call"


class ConsultationStatus(str, enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class InputType(str, enum.Enum):
    IMAGE = "image"
    TEXT = "text"
    AUDIO = "audio"


# ── Tables ──


class Doctor(Base):
    __tablename__ = "doctors"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    specialization: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    consultations: Mapped[list["Consultation"]] = relationship(back_populates="doctor")


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    date_of_birth: Mapped[datetime | None] = mapped_column(DateTime)
    medical_record_number: Mapped[str | None] = mapped_column(String(100), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    consultations: Mapped[list["Consultation"]] = relationship(back_populates="patient")


class Consultation(Base):
    __tablename__ = "consultations"
    __table_args__ = (
        Index("ix_consultations_search", "search_vector", postgresql_using="gin"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    doctor_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("doctors.id"), nullable=False)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), nullable=False)
    consultation_type: Mapped[ConsultationType] = mapped_column(
        Enum(ConsultationType, name="consultation_type_enum"), nullable=False
    )
    status: Mapped[ConsultationStatus] = mapped_column(
        Enum(ConsultationStatus, name="consultation_status_enum"),
        default=ConsultationStatus.ACTIVE,
    )
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    summary: Mapped[str | None] = mapped_column(Text)
    search_vector: Mapped[None] = mapped_column(TSVECTOR, nullable=True)

    doctor: Mapped["Doctor"] = relationship(back_populates="consultations")
    patient: Mapped["Patient"] = relationship(back_populates="consultations")
    inputs: Mapped[list["ConsultationInput"]] = relationship(back_populates="consultation", cascade="all, delete-orphan")
    analysis_results: Mapped[list["AnalysisResult"]] = relationship(back_populates="consultation", cascade="all, delete-orphan")


class ConsultationInput(Base):
    __tablename__ = "consultation_inputs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    consultation_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("consultations.id"), nullable=False)
    input_type: Mapped[InputType] = mapped_column(Enum(InputType, name="input_type_enum"), nullable=False)
    file_path: Mapped[str | None] = mapped_column(String(500))
    raw_text: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    consultation: Mapped["Consultation"] = relationship(back_populates="inputs")
    analysis_results: Mapped[list["AnalysisResult"]] = relationship(back_populates="input")


class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    consultation_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("consultations.id"), nullable=False)
    input_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("consultation_inputs.id"))
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    result: Mapped[dict] = mapped_column(JSONB, nullable=False)
    embedding = mapped_column(Vector(768), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    consultation: Mapped["Consultation"] = relationship(back_populates="analysis_results")
    input: Mapped["ConsultationInput | None"] = relationship(back_populates="analysis_results")
