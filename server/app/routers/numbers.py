from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Request

from ..services.vapi_client import get_vapi_client_from_request


router = APIRouter(prefix="/api/numbers", tags=["numbers"])


def _get_numbers_resource(client: Any):
	for attr in ["phone_numbers", "numbers", "phoneNumbers", "telephony_numbers"]:
		if hasattr(client, attr):
			return getattr(client, attr)
	raise HTTPException(status_code=501, detail="Numbers resource not available in SDK")


def _extract_assistant_id(number_obj: Any) -> Optional[str]:
	# Support various shapes
	for key in ["assistantId", "assistant_id", "assistant_id", "assistant"]:
		if hasattr(number_obj, key):
			val = getattr(number_obj, key)
			if isinstance(val, dict):
				return val.get("id") or val.get("assistantId")
			return val
	# Try dict() output
	try:
		d = number_obj.dict()
		return d.get("assistantId") or d.get("assistant_id") or (d.get("assistant") or {}).get("id")
	except Exception:
		return None


@router.get("")
def list_numbers(request: Request) -> List[Dict[str, Any]]:
	client = get_vapi_client_from_request(request)
	res = _get_numbers_resource(client)
	items = res.list(limit=200) if hasattr(res, "list") else res.get()
	out: List[Dict[str, Any]] = []
	for n in items:
		try:
			d = n.dict()
		except Exception:
			d = dict(n) if isinstance(n, dict) else {}
		assistant_id = _extract_assistant_id(n)
		phone = d.get("phoneNumber") or d.get("number") or d.get("e164") or d.get("id")
		out.append({
			"id": d.get("id") or phone,
			"phoneNumber": phone,
			"assistantId": assistant_id,
		})
	return out


@router.put("/{number_id}/assistant")
def update_number_assistant(number_id: str, request: Request, assistant_id: Optional[str] = None) -> Dict[str, Any]:
	client = get_vapi_client_from_request(request)
	res = _get_numbers_resource(client)
	# Try common update signatures
	last_error: Optional[Exception] = None
	for kwargs in (
		{"assistant_id": assistant_id},
		{"assistantId": assistant_id},
		{"model": {"assistantId": assistant_id}},
	):
		try:
			updated = res.update(number_id, **kwargs)
			return updated.dict() if hasattr(updated, "dict") else updated
		except Exception as e:
			last_error = e
	raise HTTPException(status_code=400, detail=f"Failed to update number assistant: {last_error}")

