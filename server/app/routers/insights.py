from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException
import httpx

from ..config import settings


router = APIRouter(prefix="/api/insights", tags=["insights"])


@router.post("/compare")
def compare_responses(human_response: str | None = None, ai_response: str | None = None, transcript: str | None = None) -> Dict[str, Any]:
	"""Compare human vs AI response using Azure OpenAI.

	You can provide either (human_response and ai_response) or a full transcript.
	Requires AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, AZURE_OPENAI_DEPLOYMENT.
	"""
	if not (settings.AZURE_OPENAI_ENDPOINT and settings.AZURE_OPENAI_API_KEY and settings.AZURE_OPENAI_DEPLOYMENT):
		raise HTTPException(status_code=501, detail="Azure OpenAI not configured")
	url = f"{settings.AZURE_OPENAI_ENDPOINT}/openai/deployments/{settings.AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=2024-08-01-preview"
	if transcript:
		user_content = f"Transcript:\n{transcript}\n\nExtract the human vs AI responses and produce a concise comparison with scores (helpfulness, clarity, tone, compliance) 0-10 each, and a short paragraph on improvement advice."
	else:
		user_content = f"Human: {human_response}\nAI: {ai_response}"
	body = {
		"messages": [
			{"role": "system", "content": "You are an expert call QA coach."},
			{"role": "user", "content": user_content},
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

