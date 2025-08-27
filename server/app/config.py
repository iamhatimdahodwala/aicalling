from pydantic_settings import BaseSettings


class Settings(BaseSettings):
	VAPI_TOKEN: str = ""
	ESCALATE_WEBHOOK_URL: str = ""
	CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
	KB_DOCS_WEBHOOK_URL: str = ""

	class Config:
		env_file = ".env"


settings = Settings()

