# Stage 1: Build the React frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /build

# Install deps first for better layer caching
COPY app/package*.json ./
RUN npm ci

COPY app/ ./
RUN npm run build
# Output: /build/dist/

# Stage 2: Python backend
FROM python:3.11-slim AS backend

# System dependencies:
#   libpq-dev  → asyncpg / psycopg2 compile
#   libsndfile1 ffmpeg → librosa / soundfile (audio processing)
#   gcc        → some Python package compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
        gcc \
        libpq-dev \
        libsndfile1 \
        ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies (heavy layer — cached unless requirements.txt changes)
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY src/       ./src/
COPY alembic/   ./alembic/
COPY alembic.ini ./

# Copy built frontend into the location FastAPI will serve as static files
COPY --from=frontend-builder /build/dist ./app/dist/

# Persistent storage for model uploads
RUN mkdir -p data/uploads

EXPOSE 8000

# Run DB migrations then start the server.
# In production override CMD or use an entrypoint script.
CMD alembic upgrade head && \
    uvicorn src.api.app:app --host 0.0.0.0 --port 8000
