import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from backend root or parent if present
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "smartattend-enterprise-super-secret-key-2026-secure")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "smartattend-jwt-auth-token-signature-key-2026")
    JWT_EXPIRATION_HOURS = int(os.environ.get("JWT_EXPIRATION_HOURS", 24))
    
    # Database
    DATABASE_PATH = BASE_DIR / "smartattend.db"
    DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{DATABASE_PATH}")
    
    # Uploads / Storage
    UPLOAD_FOLDER = BASE_DIR / "uploads"
    SNAPSHOTS_FOLDER = UPLOAD_FOLDER / "snapshots"
    AVATARS_FOLDER = UPLOAD_FOLDER / "avatars"
    
    # AI Biometrics & Anti-Spoofing Settings
    FACE_CONFIDENCE_THRESHOLD = float(os.environ.get("FACE_CONFIDENCE_THRESHOLD", 0.65))
    ANTI_SPOOFING_THRESHOLD = float(os.environ.get("ANTI_SPOOFING_THRESHOLD", 0.70))
    LIVENESS_MODE = os.environ.get("LIVENESS_MODE", "HYBRID_CNN_TEXTURE")
    MIN_FACE_SIZE = int(os.environ.get("MIN_FACE_SIZE", 60))
    
    # Work Shift Rules
    OFFICE_START_TIME = os.environ.get("OFFICE_START_TIME", "09:00")
    LATE_GRACE_PERIOD_MINUTES = int(os.environ.get("LATE_GRACE_PERIOD_MINUTES", 15))
    OFFICE_END_TIME = os.environ.get("OFFICE_END_TIME", "17:00")
    
    @classmethod
    def init_folders(cls):
        cls.UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)
        cls.SNAPSHOTS_FOLDER.mkdir(parents=True, exist_ok=True)
        cls.AVATARS_FOLDER.mkdir(parents=True, exist_ok=True)
