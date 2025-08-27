from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, UploadFile, File
from openpyxl import load_workbook

from vapi.types.create_customer_dto import CreateCustomerDto
from vapi.types.schedule_plan import SchedulePlan

from ..services.vapi_client import get_vapi_client


router = APIRouter(prefix="/api/calls", tags=["calls"])


@router.get("")
def list_calls(limit: int = 100) -> List[Dict[str, Any]]:
	client = get_vapi_client()
	calls = client.calls.list(limit=limit)
	return [c.dict() for c in calls]


@router.get("/{call_id}")
def get_call(call_id: str) -> Dict[str, Any]:
	client = get_vapi_client()
	try:
		call = client.calls.get(call_id)
		return call.dict()
	except Exception as e:
		raise HTTPException(status_code=404, detail=str(e))


@router.get("/{call_id}/artifacts")
def get_call_artifacts(call_id: str) -> Dict[str, Any]:
	client = get_vapi_client()
	call = client.calls.get(call_id)
	artifact = (call.artifact or {}).dict() if hasattr(call, "artifact") and call.artifact is not None else {}
	return {
		"transcript": artifact.get("transcript"),
		"recordingUrl": artifact.get("recordingUrl"),
		"stereoRecordingUrl": artifact.get("stereoRecordingUrl"),
		"videoRecordingUrl": artifact.get("videoRecordingUrl"),
		"recording": artifact.get("recording"),
	}


@router.post("/schedule/upload")
async def schedule_calls_from_excel(
	assistant_id: str,
	file: UploadFile = File(...),
):
	"""Upload Excel with headers: name, number, earliest_at, latest_at (ISO8601).

	Creates batch outbound calls via client.calls.create(customers=[...], schedule_plan=...).
	"""
	client = get_vapi_client()
	wb = load_workbook(filename=await file.read(), data_only=True)
	ws = wb.active
	rows = list(ws.iter_rows(values_only=True))
	if not rows:
		raise HTTPException(status_code=400, detail="Empty Excel file")
	headers = [str(h).strip().lower() for h in rows[0]]
	try:
		name_idx = headers.index("name")
		number_idx = headers.index("number")
		earliest_idx = headers.index("earliest_at")
		latest_idx = headers.index("latest_at") if "latest_at" in headers else None
	except ValueError:
		raise HTTPException(status_code=400, detail="Headers must include name, number, earliest_at, optional latest_at")

	customers: List[CreateCustomerDto] = []
	for row in rows[1:]:
		if row is None:
			continue
		name = str(row[name_idx]) if row[name_idx] is not None else None
		number = str(row[number_idx]) if row[number_idx] is not None else None
		if not number:
			continue
		customers.append(CreateCustomerDto(name=name, number=number))

	if not customers:
		raise HTTPException(status_code=400, detail="No valid rows found")

	# For batch scheduling, we set a broad schedule plan from the first row.
	first = rows[1]
	earliest_at_raw = first[earliest_idx]
	latest_at_raw = first[latest_idx] if latest_idx is not None else None

	def parse_dt(val: Any) -> datetime:
		if isinstance(val, datetime):
			return val
		return datetime.fromisoformat(str(val))

	schedule = SchedulePlan(
		earliest_at=parse_dt(earliest_at_raw),
		latest_at=parse_dt(latest_at_raw) if latest_at_raw else None,
	)

	resp = client.calls.create(
		assistant_id=assistant_id,
		customers=customers,
		schedule_plan=schedule,
	)
	return resp.dict()

