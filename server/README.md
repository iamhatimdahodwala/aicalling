Vapi AI Call Management - Backend (FastAPI)

Run the API locally:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt  # includes Vapi SDK
export VAPI_TOKEN=sk_your_token
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Environment:

- VAPI_TOKEN: Your Vapi server API token
- ESCALATE_WEBHOOK_URL: Optional. URL to receive escalate events `{ callId, destination }`
- CORS_ORIGINS: Comma separated list of allowed origins (default: localhost ports)

API overview:

- GET /health
- GET /api/agents list assistants
- GET /api/agents/{id} get assistant
- PUT /api/agents/{id}/system-prompt body: plain text to replace system prompt (OpenAI-style models)
- PUT /api/agents/{id}/knowledge-base query/body: knowledge_base_id
- GET /api/calls list calls
- GET /api/calls/{id} call details
- GET /api/calls/{id}/artifacts transcript + recording URLs
- POST /api/calls/schedule/upload?assistant_id=... form-data file=Excel with headers: name, number, earliest_at, latest_at
- GET /api/live/session/{call_id} monitor URLs (if enabled)
- POST /api/live/session/{session_id}/terminate mark session completed
- POST /api/live/session/{session_id}/escalate naive escalation flag (customize per org)

Notes:

- Live control: Depending on org setup, use assistant.monitorPlan to enable listen/control URLs. The SDK exposes them in call.monitor.
- Artifacts: Transcript and recordings are available on call.artifact when enabled via assistant.artifactPlan.

