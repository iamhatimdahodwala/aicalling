from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from .config import settings
from .routers import agents, calls, live, knowledge_base



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
app.include_router(knowledge_base.router)

# Optionally serve the frontend if built
FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../web/frontend/dist"))
if os.path.isdir(FRONTEND_DIR):
	app.mount("/static", StaticFiles(directory=os.path.join(FRONTEND_DIR, "assets")), name="static")

	@app.get("/")
	def serve_root():
		return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

