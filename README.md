# Hippocrates-X

Multimodal medical AI assistant that fuses chest X-ray analysis, clinical text understanding, audio transcription, and large language model reasoning into a single pipeline for clinical decision support.

## Architecture

```
Image (CXR)  -->  CXformer (87M)         --+
                                            |
Clinical Text -->  Bio_ClinicalBERT (110M) -+--> FusionOrchestrator --> ReasoningEngine --> Response
                                            |        (GPT-4o / OpenBioLLM-8B)
Audio         -->  Distil-Whisper (756M)  --+
```

**Backend**: FastAPI, SQLAlchemy (async), PostgreSQL + pgvector, Alembic  
**Frontend**: React, TypeScript, Mantine UI, Recharts  
**ML**: PyTorch, HuggingFace Transformers  
**Deployment**: Docker (multi-stage build), Docker Compose

## Evaluation Results

Evaluated against public radiology benchmarks (NIH ChestX-ray14, MIMIC-CXR). Full reports in `eval_report.json` and `eval_report_50.json`.

| Metric | NIH (n=50) | MIMIC (n=50) |
|--------|-----------|-------------|
| Label Concordance | 100% | 93.1% |
| Clinical Coverage | 99.5% | 99.5% |
| Hallucination Rate | 4% | 0% |
| Median Latency | 10.2s | 12.9s |
| Multimodal Gain | +15% | +29.9% |
| Overall | 6/6 PASS | 6/6 PASS |

## Quick Start

### Prerequisites

- Docker and Docker Compose
- OpenAI API key (or HuggingFace token for local models)

### 1. Configure

```bash
cp .env.example .env
# Edit .env with your API keys
```

### 2. Start

```bash
docker compose up -d
```

This starts PostgreSQL (pgvector) and the backend. The API is available at `http://localhost:8000`. The frontend is served from the same port.

### 3. Verify

```bash
python scripts/smoke_test.py
```

## Project Structure

```
src/
  api/          FastAPI app, routes, schemas, dependency injection
  config/       Pydantic settings (reads .env)
  db/           SQLAlchemy models, repositories, engine
  models/       ML model wrappers
    vision.py     CXformer (m42-health/CXformer-base)
    nlp.py        Bio_ClinicalBERT (emilyalsentzer/Bio_ClinicalBERT)
    audio.py      Distil-Whisper (distil-whisper/distil-large-v3.5)
    reasoning.py  GPT-4o or Llama3-OpenBioLLM-8B
  services/     Business logic
    fusion.py              Multimodal orchestrator, model lifecycle
    consultation.py        Consultation session management
    patient_intelligence.py  AI deep-dive outside consultations
    follow_up.py           AI-generated follow-up recommendations
    analytics.py           Aggregate dashboard queries

app/            React frontend (Vite + Mantine)
alembic/        Database migrations
scripts/        Evaluation and testing tools
tests/          Pytest suite (async, SQLite-backed)
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/health/models` | Model status and memory |
| POST | `/api/doctors` | Create doctor |
| POST | `/api/patients` | Create patient |
| POST | `/api/consultations` | Start consultation |
| POST | `/api/consultations/{id}/inputs/text` | Add text input |
| POST | `/api/consultations/{id}/inputs/file` | Upload image/audio |
| POST | `/api/consultations/{id}/analyze` | Run multimodal analysis |
| PATCH | `/api/consultations/{id}` | End consultation (generates summary) |
| POST | `/api/analyze` | Standalone analysis (no consultation) |
| POST | `/api/patients/{id}/intelligence/deep-dive` | AI deep-dive on patient |
| POST | `/api/patients/{id}/intelligence/ask` | Ask about a patient |
| POST | `/api/patients/{id}/intelligence/differential` | Differential diagnosis |
| GET | `/api/follow-ups` | List follow-ups |
| GET | `/api/analytics/consultations` | Consultation statistics |
| GET | `/api/search?q=` | Full-text search |
| POST | `/api/search/semantic` | Semantic search (pgvector) |

## Evaluation

Run the evaluation suite against local datasets in `data/raw/`:

```bash
# Evaluate on NIH ChestX-ray14 and MIMIC-CXR
python scripts/evaluate.py --dataset all --limit 50 --report eval_report.json

# Load datasets through the pipeline
python scripts/load_public_datasets.py --dataset inventory
python scripts/load_public_datasets.py --dataset nih --limit 20

# Benchmark latency
python scripts/benchmark.py

# Seed demo data (no downloads required)
python scripts/demo_seed.py
```

### Supported Datasets

| Dataset | Type | Size | License |
|---------|------|------|---------|
| NIH ChestX-ray14 | CXR + labels | 112K images | Public Domain |
| MIMIC-CXR | CXR + reports | 377K images | PhysioNet |
| CheXpert | CXR + labels | 224K images | Stanford AIMI |
| Open-i (IU X-Ray) | CXR images | 7.4K images | NLM Open Access |

## Testing

```bash
# Unit tests (SQLite-backed, no external dependencies)
pytest tests/ -v

# Smoke test against running server
python scripts/smoke_test.py

# Docker smoke test
docker compose --profile test up smoke-test
```

## Configuration

All settings are configured via environment variables (`.env`):

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql+asyncpg://...` | Database connection |
| `REASONING_BACKEND` | `openai` | `openai` or `local` |
| `OPENAI_API_KEY` | | Required if backend is `openai` |
| `OPENAI_MODEL` | `gpt-4o` | OpenAI model identifier |
| `HF_TOKEN` | | HuggingFace token for gated models |
| `VISION_MODEL` | `m42-health/CXformer-base` | Vision encoder |
| `NLP_MODEL` | `emilyalsentzer/Bio_ClinicalBERT` | Clinical NLP |
| `AUDIO_MODEL` | `distil-whisper/distil-large-v3.5` | Speech-to-text |
| `DEVICE` | `auto` | `cuda`, `cpu`, or `auto` |

## Model Lifecycle

Models load on first use and unload after idle timeout. The `FusionOrchestrator` manages this:

- Vision (CXformer): 175 MB, 10 min TTL
- NLP (Bio_ClinicalBERT): 220 MB, 30 min TTL
- Audio (Distil-Whisper): 1.5 GB, 10 min TTL
- Reasoning (OpenBioLLM-8B): 16 GB, 30 min TTL (local) / negligible (OpenAI)

A machine with 16 GB RAM can run the full pipeline by loading models sequentially.

## License

This project is for research and educational purposes.
