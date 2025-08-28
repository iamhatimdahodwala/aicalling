from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException
import httpx

from ..config import settings


router = APIRouter(prefix="/api/insights", tags=["insights"])


@router.post("/compare")
def compare_responses(human_response: str, ai_response: str) -> Dict[str, Any]:
	"""Compare human vs AI response using Azure OpenAI.

	Requires AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, AZURE_OPENAI_DEPLOYMENT.
	"""
	if not (settings.AZURE_OPENAI_ENDPOINT and settings.AZURE_OPENAI_API_KEY and settings.AZURE_OPENAI_DEPLOYMENT):
		raise HTTPException(status_code=501, detail="Azure OpenAI not configured")
	url = f"{settings.AZURE_OPENAI_ENDPOINT}/openai/deployments/{settings.AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=2024-08-01-preview"
	body = {
		"messages": [
			{"role": "system", "content": "You are an expert call QA coach. Compare the human vs AI responses for helpfulness, clarity, tone, and compliance. Provide a brief score out of 10 for each and a one-paragraph improvement advice."},
			{"role": "user", "content": f"Human: {human_response}\nAI: {ai_response}"},
		],
		"temperature": 0.2,
	}
	headers = {"api-key": settings.AZURE_OPENAI_API_KEY}
	with httpx.Client(timeout=30) as c:
		r = c.post(url, json=body, headers=headers)
		if r.status_code >= 400:
			raise HTTPException(status_code=r.status_code, detail=r.text)
		data = r.json()
		choice = (data.get("choices") or [{}])[0]
		content = (choice.get("message") or {}).get("content") or ""
		return {"analysis": content}

