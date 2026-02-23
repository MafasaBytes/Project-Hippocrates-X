# Backend Redesign — Masterplan

**Project Hippocrates X** — Production-grade medical AI interface.  
This document is the single source of truth for backend gaps, improvements, and implementation status.

---

## 1. Goals

- **Connect all backend capabilities to the frontend** where applicable.
- **Expose consultation inputs** so the UI can display them and pass `input_id` for multi-modal analysis.
- **Support doctor selection** via a list endpoint and future frontend wiring.
- **Keep API contracts stable** and avoid breaking existing consumers.
- **Preserve performance** (no N+1 on list endpoints, optional loading of heavy fields).

---

## 2. Audit-Derived Gaps (Summary)

| Gap | Backend state | Frontend state | Priority |
|-----|----------------|----------------|----------|
| Doctors API unused | `POST/GET` doctor exist; no list | Hardcoded `doctor_id` in BeginConsultationModal | P1 |
| Consultation inputs not in GET | `ConsultationDetail` has no `inputs` | InputPanel uses local state only; no `input_id` for analysis | P1 |
| Multi-modal analysis underused | Backend accepts `clinical_text`, `input_id` | AnalysisPanel sends only `prompt` | P2 (frontend) |
| Standalone analysis unused | `POST /api/analyze` exists | No UI calls it | P3 |
| WebSocket proxy for `/api` | N/A | Vite proxies `/api` to HTTP; WS upgrade may need verification | P3 |

---

## 3. Backend Improvements (This Repo)

### 3.1 Doctors — List endpoint ✅ (implemented)

- **Add:** `GET /api/doctors` — list doctors with optional `limit`/`offset`.
- **Purpose:** Frontend can fetch doctors for selection when starting a consultation (replace hardcoded UUID).
- **Implementation:** New `list_doctors` in repo; new route returning `list[DoctorOut]`.
- **Status:** Implemented.

### 3.2 Consultation detail — Include inputs ✅ (implemented)

- **Add:** `ConsultationDetail.inputs: list[InputOut]` (default `[]`).
- **Behaviour:**
  - **GET /api/consultations/{id}:** Return consultation with `inputs` populated (already loaded via `selectinload`).
  - **GET /api/consultations (list):** Return each consultation with `inputs=[]` to avoid N+1 and keep response size small.
- **Purpose:** Frontend can show server-side inputs after refresh and pass `input_id` to `POST .../analyze` for image/audio.
- **Implementation:** Extend schema; in routes build `ConsultationDetail` explicitly (get with inputs, list without).
- **Status:** Implemented.

### 3.3 Analysis — No backend change

- Backend already supports `prompt`, `clinical_text`, `input_id`. Frontend will send `input_id` and optional `clinical_text` once inputs are exposed (see 3.2).
- **Status:** N/A (frontend follow-up).

### 3.4 Standalone analysis

- **Backend:** No change; `POST /api/analyze` remains available.
- **Frontend (later):** Optional “quick analysis” screen that calls `analysisApi.standalone()`.
- **Status:** Deferred.

### 3.5 WebSocket transcription

- **Backend:** No change.
- **Dev proxy:** If WS to `/api/transcribe` fails in dev, add explicit WebSocket proxy for `/api` in Vite (or ensure HTTP proxy upgrades WS).
- **Status:** Deferred until needed.

---

## 4. API Contract Summary (After Redesign)

| Method | Path | Response / Notes |
|--------|------|-------------------|
| GET | `/health` | `{ status, project }` |
| GET | `/api/doctors` | `list[DoctorOut]` (new) |
| POST | `/api/doctors` | `DoctorOut` |
| GET | `/api/doctors/{id}` | `DoctorOut` |
| GET | `/api/patients?q=&limit=` | `list[PatientOut]` |
| POST | `/api/patients` | `PatientOut` |
| GET | `/api/patients/{id}` | `PatientOut` |
| POST | `/api/consultations` | `ConsultationOut` |
| GET | `/api/consultations` | `list[ConsultationDetail]` (each with `inputs=[]`) |
| GET | `/api/consultations/{id}` | `ConsultationDetail` (with `inputs` populated) |
| PATCH | `/api/consultations/{id}` | `ConsultationEndOut` |
| POST | `/api/consultations/{id}/inputs/text` | `InputOut` |
| POST | `/api/consultations/{id}/inputs/file` | `InputOut` |
| POST | `/api/consultations/{id}/analyze` | `AnalysisOut` |
| POST | `/api/analyze` | `AnalysisOut` (standalone) |
| GET | `/api/search?q=&limit=` | `list[SearchResultOut]` |
| POST | `/api/search/semantic` | `list[AnalysisSearchResultOut]` |
| WS | `/api/transcribe` | Real-time transcription |

---

## 5. Frontend Follow-Ups (Out of Scope for Backend)

- **BeginConsultationModal:** Call `GET /api/doctors`, show doctor selector (or “current user” when auth exists); remove hardcoded `doctor_id`.
- **InputPanel:** Consume `consultation.inputs` from GET consultation; merge with local optimistic list; allow selecting an input for analysis.
- **AnalysisPanel:** Send `input_id` (and optionally `clinical_text`) when user selects an input or pastes text.
- **Optional:** Standalone analysis page using `POST /api/analyze`.

---

## 6. Implementation Checklist

- [x] Add `GET /api/doctors` and `list_doctors` in repo.
- [x] Add `inputs` to `ConsultationDetail` schema.
- [x] Return `ConsultationDetail` with `inputs` in `GET /api/consultations/{id}` (no N+1; inputs already loaded).
- [x] Return `list[ConsultationDetail]` with `inputs=[]` in `GET /api/consultations` (no N+1).
- [ ] (Frontend) Wire doctors list and remove hardcoded doctor_id.
- [ ] (Frontend) Use consultation inputs in InputPanel and AnalysisPanel.

---

## 7. References

- Audit: *Backend–frontend connectivity audit* (see prior report).
- API schemas: `src/api/schemas.py`.
- Routes: `src/api/routes/` and `src/api/app.py`.
