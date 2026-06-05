import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

cors_origins_str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
CORS_ORIGINS = [origin.strip() for origin in cors_origins_str.split(",") if origin.strip()]
