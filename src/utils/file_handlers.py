from pathlib import Path
from uuid import uuid4

import aiofiles

from src.config import settings

ALLOWED_IMAGE_TYPES = {".png", ".jpg", ".jpeg", ".dcm", ".dicom"}
ALLOWED_AUDIO_TYPES = {".wav", ".mp3", ".flac", ".ogg", ".m4a"}


async def save_upload(data: bytes, filename: str, consultation_id: str) -> Path:
    ext = Path(filename).suffix.lower()
    dest_dir = settings.upload_dir / consultation_id
    dest_dir.mkdir(parents=True, exist_ok=True)

    safe_name = f"{uuid4().hex}{ext}"
    dest_path = dest_dir / safe_name

    async with aiofiles.open(dest_path, "wb") as f:
        await f.write(data)

    return dest_path


def classify_file(filename: str) -> str | None:
    ext = Path(filename).suffix.lower()
    if ext in ALLOWED_IMAGE_TYPES:
        return "image"
    if ext in ALLOWED_AUDIO_TYPES:
        return "audio"
    if ext in {".txt", ".csv", ".json", ".pdf"}:
        return "text"
    return None
