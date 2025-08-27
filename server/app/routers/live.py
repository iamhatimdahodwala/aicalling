from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, HTTPException

from ..services.vapi_client import get_vapi_client


router = APIRouter(prefix="/api/live", tags=["live"])


@router.get("/session/{call_id}")
def get_live_session_info(call_id: str) -> Dict[str, Any]:
	"""Return info useful for live monitoring and control.

	Note: The SDK exposes monitor.listenUrl/controlUrl via call.monitor, when enabled in assistant.monitorPlan.
	"""
	client = get_vapi_client()
	call = client.calls.get(call_id)
	monitor = call.monitor.dict() if getattr(call, "monitor", None) is not None else {}
	return {
		"monitor": monitor,
	}


@router.post("/session/{session_id}/terminate")
def terminate_session(session_id: str):
	"""Terminate a session by setting its status to completed.

	SDK doesn't expose a specialized terminate action; we update status.
	"""
	client = get_vapi_client()
	try:
		updated = client.sessions.update(session_id, status="completed")
		return updated.dict()
	except Exception as e:
		raise HTTPException(status_code=400, detail=str(e))


@router.post("/session/{session_id}/escalate")
def escalate_session(session_id: str, destination: str | None = None):
	"""Example placeholder to escalate a call by updating messages or metadata.

	Depending on your Vapi configuration, escalation may be implemented via a Transfer tool or server webhook.
	This endpoint triggers a server-side flag that your assistant can react to via tools or webhook.
	"""
	client = get_vapi_client()
	# We append a message to session to hint escalation via model/tooling
	try:
		updated = client.sessions.update(
			session_id,
			messages=[{"role": "system", "content": f"ESCALATE {destination or ''}"}],
		)
		return updated.dict()
	except Exception as e:
		raise HTTPException(status_code=400, detail=str(e))

