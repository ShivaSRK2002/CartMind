import os
from pathlib import Path

from dotenv import load_dotenv

PACKAGE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(PACKAGE_DIR / ".env")

DATABASE_URL = os.environ.get(
    "DATABASE_URL", "postgres://cartmind:cartmind@localhost:5432/cartmind"
)

MODELS_DIR = PACKAGE_DIR / "models"
MODELS_DIR.mkdir(exist_ok=True)

MODEL_VERSION = "cartmind-ml-py-v1"
RANDOM_SEED = 42
