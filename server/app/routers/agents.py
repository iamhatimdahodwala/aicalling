from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException

from vapi.assistants.types.update_assistant_dto_model import UpdateAssistantDtoModel
from vapi.types.open_ai_message import OpenAiMessage
from vapi.types.open_ai_message_role import OpenAiMessageRole

from ..services.vapi_client import get_vapi_client


router = APIRouter(prefix="/api/agents", tags=["agents"])


@router.get("")
def list_agents() -> List[Dict[str, Any]]:
	client = get_vapi_client()
	agents = client.assistants.list()
	return [a.dict() for a in agents]


@router.get("/{agent_id}")
def get_agent(agent_id: str) -> Dict[str, Any]:
	client = get_vapi_client()
	try:
		assistant = client.assistants.get(agent_id)
		return assistant.dict()
	except Exception as e:  # SDK raises ApiError subclasses; return 404/400 generically
		raise HTTPException(status_code=404, detail=str(e))


@router.put("/{agent_id}/system-prompt")
def update_system_prompt(agent_id: str, prompt: str):
	"""Replace the assistant's system prompt for OpenAI-like models.

	We update assistant.model.messages, preserving other fields.
	"""
	client = get_vapi_client()
	assistant = client.assistants.get(agent_id)
	model = assistant.model
	if model is None:
		raise HTTPException(status_code=400, detail="Assistant has no model configured")

	# Convert to dict, replace messages with a single system message
	model_dict = model.dict()
	model_dict["messages"] = [
		OpenAiMessage(role=OpenAiMessageRole("system"), content=prompt).dict()
	]

	updated = client.assistants.update(
		agent_id,
		model=UpdateAssistantDtoModel.parse_obj(model_dict),
	)
	return updated.dict()


@router.put("/{agent_id}/knowledge-base")
def update_knowledge_base(agent_id: str, knowledge_base_id: Optional[str] = None):
	"""Point the assistant model to a specific knowledge base by ID.

	This sets assistant.model.knowledgeBaseId. For transient KBs, a separate flow is needed.
	"""
	client = get_vapi_client()
	assistant = client.assistants.get(agent_id)
	model = assistant.model
	if model is None:
		raise HTTPException(status_code=400, detail="Assistant has no model configured")

	model_dict = model.dict()
	model_dict["knowledgeBaseId"] = knowledge_base_id

	updated = client.assistants.update(
		agent_id,
		model=UpdateAssistantDtoModel.parse_obj(model_dict),
	)
	return updated.dict()

