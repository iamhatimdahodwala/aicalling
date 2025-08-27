from __future__ import annotations

from typing import Any, Dict, List

import httpx
from fastapi import APIRouter, HTTPException, UploadFile, File, Request

from ..services.vapi_client import get_vapi_client_from_request
from ..config import settings


router = APIRouter(prefix="/api/kb", tags=["knowledge-base"])


@router.get("")
def list_kb(request: Request) -> List[Dict[str, Any]]:
	client = get_vapi_client_from_request(request)
	items = client.knowledge_bases.list()
	return [i.dict() for i in items]


@router.get("/{kb_id}/documents")
def list_documents(kb_id: str) -> Dict[str, Any]:
	if not settings.KB_DOCS_WEBHOOK_URL:
		raise HTTPException(status_code=501, detail="KB docs webhook not configured")
	with httpx.Client(timeout=20) as c:
		r = c.post(settings.KB_DOCS_WEBHOOK_URL, json={"action": "list", "knowledgeBaseId": kb_id})
		if r.status_code >= 400:
			raise HTTPException(status_code=r.status_code, detail=r.text)
		return r.json()


@router.post("/{kb_id}/documents")
def upload_document(kb_id: str, file: UploadFile = File(...)) -> Dict[str, Any]:
	if not settings.KB_DOCS_WEBHOOK_URL:
		raise HTTPException(status_code=501, detail="KB docs webhook not configured")
	with httpx.Client(timeout=60) as c:
		files = {"file": (file.filename or "upload.bin", file.file, file.content_type or "application/octet-stream")}
		data = {"action": "upload", "knowledgeBaseId": kb_id}
		r = c.post(settings.KB_DOCS_WEBHOOK_URL, data=data, files=files)
		if r.status_code >= 400:
			raise HTTPException(status_code=r.status_code, detail=r.text)
		return r.json()


@router.delete("/{kb_id}/documents/{doc_id}")
def delete_document(kb_id: str, doc_id: str) -> Dict[str, Any]:
	if not settings.KB_DOCS_WEBHOOK_URL:
		raise HTTPException(status_code=501, detail="KB docs webhook not configured")
	with httpx.Client(timeout=20) as c:
		r = c.post(settings.KB_DOCS_WEBHOOK_URL, json={"action": "delete", "knowledgeBaseId": kb_id, "documentId": doc_id})
		if r.status_code >= 400:
			raise HTTPException(status_code=r.status_code, detail=r.text)
		return r.json()

