export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

async function handle<T>(res: Response): Promise<T> {
	if (!res.ok) {
		const txt = await res.text();
		throw new Error(txt || `HTTP ${res.status}`);
	}
	return res.json();
}

export const api = {
	listAgents: () => fetch(`${API_BASE}/api/agents`).then(handle),
	getAgent: (id: string) => fetch(`${API_BASE}/api/agents/${id}`).then(handle),
	getSystemPrompt: (id: string) => fetch(`${API_BASE}/api/agents/${id}/system-prompt`).then(handle),
	updateSystemPrompt: (id: string, prompt: string) =>
		fetch(`${API_BASE}/api/agents/${id}/system-prompt`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(prompt),
		}).then(handle),
	updateKnowledgeBase: (id: string, knowledgeBaseId?: string) =>
		fetch(`${API_BASE}/api/agents/${id}/knowledge-base?knowledge_base_id=${knowledgeBaseId ?? ""}`, {
			method: "PUT",
		}).then(handle),
	getAssistantKb: (id: string) => fetch(`${API_BASE}/api/agents/${id}/kb`).then(handle),
	listKb: () => fetch(`${API_BASE}/api/kb`).then(handle),
	listKbDocs: (kbId: string) => fetch(`${API_BASE}/api/kb/${kbId}/documents`).then(handle),
	uploadKbDoc: (kbId: string, file: File) => {
		const form = new FormData();
		form.append("file", file);
		return fetch(`${API_BASE}/api/kb/${kbId}/documents`, { method: 'POST', body: form }).then(handle)
	},
	deleteKbDoc: (kbId: string, docId: string) => fetch(`${API_BASE}/api/kb/${kbId}/documents/${docId}`, { method: 'DELETE' }).then(handle),

	listCalls: () => fetch(`${API_BASE}/api/calls`).then(handle),
	getCall: (id: string) => fetch(`${API_BASE}/api/calls/${id}`).then(handle),
	getArtifacts: (id: string) => fetch(`${API_BASE}/api/calls/${id}/artifacts`).then(handle),

	getScheduleTemplate: () => fetch(`${API_BASE}/api/calls/schedule/template`).then(handle),
	scheduleUpload: (assistantId: string, file: File) => {
		const form = new FormData();
		form.append("file", file);
		return fetch(`${API_BASE}/api/calls/schedule/upload?assistant_id=${assistantId}`, {
			method: "POST",
			body: form,
		}).then(handle);
	},
	scheduleSingle: (data: { assistant_id: string; name?: string; number: string; earliest_at: string; latest_at?: string }) =>
		fetch(`${API_BASE}/api/calls/schedule/single`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(handle),

	getLiveSessionInfo: (callId: string) => fetch(`${API_BASE}/api/live/session/${callId}`).then(handle),
	terminateSession: (sessionId: string) =>
		fetch(`${API_BASE}/api/live/session/${sessionId}/terminate`, { method: "POST" }).then(handle),
	escalateSession: (sessionId: string, destination?: string) =>
		fetch(`${API_BASE}/api/live/session/${sessionId}/escalate${destination ? `?destination=${encodeURIComponent(destination)}` : ""}`, { method: "POST" }).then(handle),
};

