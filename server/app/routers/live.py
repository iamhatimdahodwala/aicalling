from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, HTTPException, Request

from ..services.vapi_client import get_vapi_client_from_request


router = APIRouter(prefix="/api/live", tags=["live"])


@router.get("/session/{call_id}")
def get_live_session_info(call_id: str, request: Request) -> Dict[str, Any]:
	"""Return info useful for live monitoring and control.

	Note: The SDK exposes monitor.listenUrl/controlUrl via call.monitor, when enabled in assistant.monitorPlan.
	"""
	client = get_vapi_client_from_request(request)
	call = client.calls.get(call_id)
	monitor = call.monitor.dict() if getattr(call, "monitor", None) is not None else {}
	web = getattr(call, "web", None)
	web_dict = web.dict() if web is not None and hasattr(web, "dict") else {}
	return {
		"monitor": monitor,
		"web": web_dict,
	}


@router.post("/session/{session_id}/terminate")
def terminate_session(session_id: str, request: Request):
	"""Terminate a session by setting its status to completed.

	SDK doesn't expose a specialized terminate action; we update status.
	"""
	client = get_vapi_client_from_request(request)
	try:
		updated = client.sessions.update(session_id, status="completed")
		return updated.dict()
	except Exception as e:
		raise HTTPException(status_code=400, detail=str(e))


@router.post("/session/{session_id}/escalate")
def escalate_session(session_id: str, request: Request, destination: str | None = None):
	"""Example placeholder to escalate a call by updating messages or metadata.

	Depending on your Vapi configuration, escalation may be implemented via a Transfer tool or server webhook.
	This endpoint triggers a server-side flag that your assistant can react to via tools or webhook.
	"""
	client = get_vapi_client_from_request(request)
	# We append a message to session to hint escalation via model/tooling
	try:
		updated = client.sessions.update(
			session_id,
			messages=[{"role": "system", "content": f"ESCALATE {destination or ''}"}],
		)
		return updated.dict()
	except Exception as e:
		raise HTTPException(status_code=400, detail=str(e))


@router.post("/session/{session_id}/coach")
def coach_session(session_id: str, request: Request, message: str) -> Dict[str, Any]:
	"""Send a coaching/whisper message to the live session if supported.

	If the SDK exposes a control API, use it; otherwise, store intent.
	"""
	client = get_vapi_client_from_request(request)
	try:
		if hasattr(client, "sessions") and hasattr(client.sessions, "update"):
			updated = client.sessions.update(session_id, messages=[{"role": "system", "content": f"COACH {message}"}])
			return updated.dict() if hasattr(updated, "dict") else {"ok": True}
		raise HTTPException(status_code=501, detail="Coaching not supported by SDK")
	except Exception as e:
		raise HTTPException(status_code=400, detail=str(e))

