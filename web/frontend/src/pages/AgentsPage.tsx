import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useState } from 'react'

export default function AgentsPage() {
	const { data = [], refetch, isLoading } = useQuery<any[]>({ queryKey: ['agents'], queryFn: api.listAgents as any })
	const [selected, setSelected] = useState<any | null>(null)
	const [prompt, setPrompt] = useState('')
	const [kb, setKb] = useState('')

	return (
		<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
			<div>
				<h2>Agents</h2>
				{isLoading ? 'Loading...' : (
					<table>
						<thead><tr><th>Name</th><th>Id</th></tr></thead>
						<tbody>
							{data.map((a: any) => (
								<tr key={a.id} onClick={() => { setSelected(a); setPrompt(''); setKb(''); }} style={{ cursor: 'pointer' }}>
									<td>{a.name || 'Untitled'}</td>
									<td>{a.id}</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>
			<div>
				<h3>Update Agent</h3>
				{selected ? (
					<div style={{ display: 'grid', gap: 12 }}>
						<div>
							<label>System Prompt</label>
							<textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={8} style={{ width: '100%' }} placeholder="Type new system prompt" />
							<button onClick={async () => { await api.updateSystemPrompt(selected.id, prompt); await refetch(); }}>Save Prompt</button>
						</div>
						<div>
							<label>Knowledge Base Id</label>
							<input value={kb} onChange={e => setKb(e.target.value)} placeholder="kb_xxx" />
							<button onClick={async () => { await api.updateKnowledgeBase(selected.id, kb || undefined); await refetch(); }}>Attach KB</button>
						</div>
					</div>
				) : <div>Select an agent</div>}
			</div>
		</div>
	)
}

