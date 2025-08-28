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
def list_documents(kb_id: str, request: Request) -> Dict[str, Any]:
	if settings.KB_DOCS_WEBHOOK_URL:
		with httpx.Client(timeout=20) as c:
			r = c.post(settings.KB_DOCS_WEBHOOK_URL, json={"action": "list", "knowledgeBaseId": kb_id}, headers={"x-vapi-token": request.headers.get("x-vapi-token", "")})
			if r.status_code >= 400:
				raise HTTPException(status_code=r.status_code, detail=r.text)
			return r.json()
	# Fallback to SDK if webhook not configured
	client = get_vapi_client_from_request(request)
	try:
		# Try common SDK shapes
		out_docs: List[Any] = []
		try:
			out_docs = client.knowledge_bases.documents.list(kb_id)  # type: ignore[attr-defined]
		except Exception:
			try:
				out_docs = client.documents.list(knowledge_base_id=kb_id)  # type: ignore[attr-defined]
			except Exception:
				out_docs = []
		resp: List[Dict[str, Any]] = []
		for d in out_docs or []:
			try:
				dd = d.dict()
			except Exception:
				dd = dict(d) if isinstance(d, dict) else {}
			resp.append({
				"id": dd.get("id") or dd.get("documentId") or dd.get("name"),
				"name": dd.get("name") or dd.get("filename") or dd.get("id") or dd.get("documentId"),
			})
		return {"documents": resp}
	except Exception as e:
		raise HTTPException(status_code=500, detail=f"List documents failed: {e}")


@router.post("/{kb_id}/documents")
def upload_document(kb_id: str, request: Request, file: UploadFile = File(...)) -> Dict[str, Any]:
	if not settings.KB_DOCS_WEBHOOK_URL:
		raise HTTPException(status_code=501, detail="KB docs webhook not configured")
	with httpx.Client(timeout=60) as c:
		files = {"file": (file.filename or "upload.bin", file.file, file.content_type or "application/octet-stream")}
		data = {"action": "upload", "knowledgeBaseId": kb_id}
		r = c.post(settings.KB_DOCS_WEBHOOK_URL, data=data, files=files, headers={"x-vapi-token": request.headers.get("x-vapi-token", "")})
		if r.status_code >= 400:
			raise HTTPException(status_code=r.status_code, detail=r.text)
		return r.json()


@router.delete("/{kb_id}/documents/{doc_id}")
def delete_document(kb_id: str, doc_id: str, request: Request) -> Dict[str, Any]:
	if not settings.KB_DOCS_WEBHOOK_URL:
		raise HTTPException(status_code=501, detail="KB docs webhook not configured")
	with httpx.Client(timeout=20) as c:
		r = c.post(settings.KB_DOCS_WEBHOOK_URL, json={"action": "delete", "knowledgeBaseId": kb_id, "documentId": doc_id}, headers={"x-vapi-token": request.headers.get("x-vapi-token", "")})
		if r.status_code >= 400:
			raise HTTPException(status_code=r.status_code, detail=r.text)
		return r.json()

