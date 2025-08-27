from __future__ import annotations

from functools import lru_cache
from typing import Optional

from vapi import Vapi
from ..config import settings


@lru_cache(maxsize=1)
def get_vapi_client(token_override: Optional[str] = None) -> Vapi:
	"""Return a cached Vapi client.

	Parameters
	----------
	token_override: Optional[str]
		If provided, use this token instead of the configured one. Helpful for per-request overrides.

	"""
	api_token = token_override or settings.VAPI_TOKEN
	if not api_token:
		raise RuntimeError("VAPI_TOKEN is not configured. Set it in environment or .env file.")
	return Vapi(token=api_token)

