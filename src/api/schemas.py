"""Pydantic request / response schemas for the API."""

from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field


# ── Enums ──


class ConsultationTypeEnum(str, Enum):
    face_to_face = "face_to_face"
    phone_call = "phone_call"


class ConsultationStatusEnum(str, Enum):
    active = "active"
    completed = "completed"
    cancelled = "cancelled"


class InputTypeEnum(str, Enum):
    image = "image"
    text = "text"
    audio = "audio"


class GenderEnum(str, Enum):
    male = "male"
    female = "female"
    other = "other"


class RecordTypeEnum(str, Enum):
    lab_result = "lab_result"
    imaging = "imaging"
    prescription = "prescription"
    referral = "referral"
    clinical_note = "clinical_note"
    other = "other"


# ── Doctor / Patient ──


class DoctorCreate(BaseModel):
    name: str
    specialization: str | None = None


class DoctorOut(BaseModel):
    id: uuid.UUID
    name: str
    specialization: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class PatientCreate(BaseModel):
    name: str
    date_of_birth: datetime | None = None
    medical_record_number: str | None = None
    gender: GenderEnum | None = None
    blood_type: str | None = None
    phone: str | None = None
    email: str | None = None
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None
    address_line: str | None = None
    city: str | None = None
    province: str | None = None
    country: str | None = None
    postal_code: str | None = None
    allergies: list[str] | None = None
    chronic_conditions: list[str] | None = None
    notes: str | None = None


class PatientUpdate(BaseModel):
    name: str | None = None
    date_of_birth: datetime | None = None
    medical_record_number: str | None = None
    gender: GenderEnum | None = None
    blood_type: str | None = None
    phone: str | None = None
    email: str | None = None
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None
    address_line: str | None = None
    city: str | None = None
    province: str | None = None
    country: str | None = None
    postal_code: str | None = None
    allergies: list[str] | None = None
    chronic_conditions: list[str] | None = None
    notes: str | None = None


class PatientOut(BaseModel):
    id: uuid.UUID
    name: str
    date_of_birth: datetime | None
    medical_record_number: str | None
    created_at: datetime
    gender: str | None = None
    blood_type: str | None = None
    phone: str | None = None
    email: str | None = None
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None
    address_line: str | None = None
    city: str | None = None
    province: str | None = None
    country: str | None = None
    postal_code: str | None = None
    allergies: list[str] | None = None
    chronic_conditions: list[str] | None = None
    notes: str | None = None

    model_config = {"from_attributes": True}


# ── Medical Records ──


class MedicalRecordCreate(BaseModel):
    record_type: RecordTypeEnum
    title: str
    description: str | None = None
    raw_text: str | None = None
    metadata_json: dict | None = None
    record_date: datetime


class MedicalRecordOut(BaseModel):
    id: uuid.UUID
    patient_id: uuid.UUID
    record_type: str
    title: str
    description: str | None
    file_path: str | None
    raw_text: str | None
    metadata_json: dict | None
    record_date: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


class TimelineConsultationEntry(BaseModel):
    entry_type: Literal["consultation"] = "consultation"
    id: uuid.UUID
    date: datetime
    title: str
    status: str
    consultation_type: str
    summary: str | None = None


class TimelineMedicalRecordEntry(BaseModel):
    entry_type: Literal["medical_record"] = "medical_record"
    id: uuid.UUID
    date: datetime
    title: str
    record_type: str
    description: str | None = None


# ── Consultation ──


class ConsultationCreate(BaseModel):
    doctor_id: uuid.UUID
    patient_id: uuid.UUID
    consultation_type: ConsultationTypeEnum


class ConsultationOut(BaseModel):
    consultation_id: str
    status: str
    started_at: str
    type: str


class ConsultationEndRequest(BaseModel):
    generate_summary: bool = True


class ConsultationEndOut(BaseModel):
    consultation_id: str
    status: str
    ended_at: str | None
    summary: str | None


class ConsultationDetail(BaseModel):
    id: uuid.UUID
    doctor_id: uuid.UUID
    patient_id: uuid.UUID
    consultation_type: str
    status: str
    started_at: datetime
    ended_at: datetime | None
    summary: str | None
    inputs: list[InputOut] = Field(default_factory=list)


# ── Inputs ──


class TextInputCreate(BaseModel):
    raw_text: str


class InputOut(BaseModel):
    input_id: str
    type: str
    created_at: str


# ── Analysis ──


class AnalysisRequest(BaseModel):
    prompt: str
    clinical_text: str | None = None
    input_id: uuid.UUID | None = None


class StandaloneAnalysisRequest(BaseModel):
    prompt: str
    clinical_text: str | None = None


class AnalysisOut(BaseModel):
    analysis_id: str
    response: str
    model: str
    modalities_used: list[str]


# ── Search ──


class SemanticSearchRequest(BaseModel):
    query: str
    limit: int = Field(default=10, ge=1, le=100)


class SearchResultOut(BaseModel):
    consultation_id: str
    summary: str | None
    started_at: datetime

    model_config = {"from_attributes": True}


class AnalysisSearchResultOut(BaseModel):
    analysis_id: str
    consultation_id: str
    prompt: str
    result: dict
    created_at: datetime

    model_config = {"from_attributes": True}
