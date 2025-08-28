export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

function tokenHeader() {
	const t = (typeof window !== 'undefined') ? sessionStorage.getItem('vapi_token') : null
	return t ? { 'x-vapi-token': t } : {}
}

async function handle<T>(res: Response): Promise<T> {
	if (!res.ok) {
		const txt = await res.text();
		throw new Error(txt || `HTTP ${res.status}`);
	}
	return res.json();
}

export const api = {
	listAgents: () => fetch(`${API_BASE}/api/agents`, { headers: { ...tokenHeader() } }).then(handle),
	getAgent: (id: string) => fetch(`${API_BASE}/api/agents/${id}`, { headers: { ...tokenHeader() } }).then(handle),
	getSystemPrompt: (id: string) => fetch(`${API_BASE}/api/agents/${id}/system-prompt`, { headers: { ...tokenHeader() } }).then(handle),
	updateSystemPrompt: (id: string, prompt: string) =>
		fetch(`${API_BASE}/api/agents/${id}/system-prompt`, {
			method: "PUT",
			headers: { "Content-Type": "application/json", ...tokenHeader() },
			body: JSON.stringify(prompt),
		}).then(handle),
	updateKnowledgeBase: (id: string, knowledgeBaseId?: string) => {
		const url = new URL(`${API_BASE}/api/agents/${id}/knowledge-base`)
		if (knowledgeBaseId !== undefined) url.searchParams.set('knowledge_base_id', knowledgeBaseId)
		return fetch(url.toString(), { method: 'PUT', headers: { ...tokenHeader() } }).then(handle)
	},
	getAssistantKb: (id: string) => fetch(`${API_BASE}/api/agents/${id}/kb`, { headers: { ...tokenHeader() } }).then(handle),
	listKb: () => fetch(`${API_BASE}/api/kb`, { headers: { ...tokenHeader() } }).then(handle),
	listKbDocs: (kbId: string) => fetch(`${API_BASE}/api/kb/${kbId}/documents`, { headers: { ...tokenHeader() } }).then(handle),
	uploadKbDoc: (kbId: string, file: File) => {
		const form = new FormData();
		form.append("file", file);
		return fetch(`${API_BASE}/api/kb/${kbId}/documents`, { method: 'POST', body: form, headers: { ...tokenHeader() } }).then(handle)
	},
	deleteKbDoc: (kbId: string, docId: string) => fetch(`${API_BASE}/api/kb/${kbId}/documents/${docId}`, { method: 'DELETE', headers: { ...tokenHeader() } }).then(handle),

	listCalls: () => fetch(`${API_BASE}/api/calls`, { headers: { ...tokenHeader() } }).then(handle),
	getCall: (id: string) => fetch(`${API_BASE}/api/calls/${id}`, { headers: { ...tokenHeader() } }).then(handle),
	getArtifacts: (id: string) => fetch(`${API_BASE}/api/calls/${id}/artifacts`, { headers: { ...tokenHeader() } }).then(handle),

	getScheduleTemplate: () => fetch(`${API_BASE}/api/calls/schedule/template`, { headers: { ...tokenHeader() } }).then(handle),
	scheduleUpload: (assistantId: string, file: File) => {
		const form = new FormData();
		form.append("file", file);
		return fetch(`${API_BASE}/api/calls/schedule/upload?assistant_id=${assistantId}`, {
			method: "POST",
			body: form,
			headers: { ...tokenHeader() },
		}).then(handle);
	},
	scheduleSingle: (data: { assistant_id: string; name?: string; number: string; earliest_at: string; latest_at?: string; context?: string }) =>
		fetch(`${API_BASE}/api/calls/schedule/single`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...tokenHeader() }, body: JSON.stringify(data) }).then(handle),

	getLiveSessionInfo: (callId: string) => fetch(`${API_BASE}/api/live/session/${callId}`, { headers: { ...tokenHeader() } }).then(handle),
	terminateSession: (sessionId: string) =>
		fetch(`${API_BASE}/api/live/session/${sessionId}/terminate`, { method: "POST", headers: { ...tokenHeader() } }).then(handle),
	escalateSession: (sessionId: string, destination?: string) =>
		fetch(`${API_BASE}/api/live/session/${sessionId}/escalate${destination ? `?destination=${encodeURIComponent(destination)}` : ""}`, { method: "POST", headers: { ...tokenHeader() } }).then(handle),

	listNumbers: () => fetch(`${API_BASE}/api/numbers`, { headers: { ...tokenHeader() } }).then(handle),
	updateNumberAssistant: (numberId: string, assistantId?: string) =>
		fetch(`${API_BASE}/api/numbers/${encodeURIComponent(numberId)}/assistant${assistantId ? `?assistant_id=${encodeURIComponent(assistantId)}` : ''}`, { method: 'PUT', headers: { ...tokenHeader() } }).then(handle),
};

