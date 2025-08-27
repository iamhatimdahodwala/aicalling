from __future__ import annotations

from typing import Optional

from fastapi import HTTPException, Request
from vapi import Vapi
from ..config import settings


def get_vapi_client(token_override: Optional[str] = None) -> Vapi:
	"""Legacy helper: construct a Vapi client using provided token or env token."""
	api_token = token_override or settings.VAPI_TOKEN
	if not api_token:
		raise RuntimeError("VAPI token not provided. Pass header x-vapi-token or set VAPI_TOKEN for development.")
	return Vapi(token=api_token)


def get_vapi_client_from_request(request: Request) -> Vapi:
	"""Create a Vapi client using token from request headers.

	Looks for 'x-vapi-token' header first, then 'Authorization: Bearer <token>'.
	"""
	token = request.headers.get("x-vapi-token")
	if not token:
		auth = request.headers.get("authorization") or request.headers.get("Authorization")
		if auth and auth.lower().startswith("bearer "):
			token = auth.split(" ", 1)[1].strip()
	if not token:
		raise HTTPException(status_code=401, detail="Missing Vapi token. Provide x-vapi-token header.")
	return Vapi(token=token)

