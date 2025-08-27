from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic_settings import BaseSettings
from .routers import agents, calls, live


class Settings(BaseSettings):
	# Vapi API token
	VAPI_TOKEN: str = ""

	# Allowed CORS origins for the frontend
	CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

	class Config:
		env_file = ".env"


settings = Settings()

app = FastAPI(title="Vapi AI Call Management API")

# CORS
origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
app.add_middleware(
	CORSMiddleware,
	allow_origins=origins or ["*"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)


@app.get("/health")
def health_check():
	return {"ok": True}


# Routers
app.include_router(agents.router)
app.include_router(calls.router)
app.include_router(live.router)

