from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    hf_token: str = ""
    database_url: str = "postgresql+asyncpg://hippocrates:hippocrates_dev@localhost:5432/hippocrates"

    vision_model: str = "m42-health/CXformer-base"
    nlp_model: str = "emilyalsentzer/Bio_ClinicalBERT"
    audio_model: str = "distil-whisper/distil-large-v3.5"
    reasoning_model: str = "aaditya/Llama3-OpenBioLLM-8B"

    device: str = "auto"
    upload_dir: Path = Path("data/uploads")

    @property
    def sync_database_url(self) -> str:
        return self.database_url.replace("+asyncpg", "")


settings = Settings()
