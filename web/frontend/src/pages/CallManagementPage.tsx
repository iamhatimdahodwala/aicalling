import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useMemo, useState } from 'react'

type Tab = 'active' | 'queued' | 'all'

export default function CallManagementPage() {
	const qc = useQueryClient()
	const { data: agents = [] } = useQuery<any[]>({ queryKey: ['agents'], queryFn: api.listAgents as any })
	const [tab, setTab] = useState<Tab>('active')
	const { data: calls = [] } = useQuery<any[]>({ queryKey: ['calls', tab], queryFn: api.listCalls as any })
	const [selected, setSelected] = useState<any | null>(null)

	const filtered = useMemo(() => {
		if (!calls) return []
		if (tab === 'all') return calls
		if (tab === 'active') return calls.filter((c: any) => (c.status || '').toLowerCase() === 'active')
		if (tab === 'queued') return calls.filter((c: any) => (c.status || '').toLowerCase() === 'queued')
		return calls
	}, [calls, tab])

	return (
		<div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 360px', gap: 16 }}>
			{/* Left agents panel */}
			<div style={{ borderRight: '1px solid #eee', paddingRight: 12 }}>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
					<h3>AI Agents</h3>
					<span>{agents?.length ?? 0}</span>
				</div>
				<ul style={{ maxHeight: 360, overflow: 'auto' }}>
					{agents.map((a: any) => (
						<li key={a.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
							<span>{a.name || 'Untitled'}</span>
							<span style={{ color: '#888' }}>id:{a.id.slice(0, 6)}…</span>
						</li>
					))}
				</ul>
			</div>

			{/* Center calls table with tabs */}
			<div>
				<div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
					<button onClick={() => setTab('active')} disabled={tab === 'active'}>Active Calls</button>
					<button onClick={() => setTab('queued')} disabled={tab === 'queued'}>Queue</button>
					<button onClick={() => setTab('all')} disabled={tab === 'all'}>All</button>
				</div>
				<table style={{ width: '100%' }}>
					<thead>
						<tr>
							<th>Caller</th>
							<th>Agent</th>
							<th>Duration</th>
							<th>Status</th>
						</tr>
					</thead>
					<tbody>
						{filtered.map((c: any) => (
							<tr key={c.id} onClick={() => setSelected(c)} style={{ cursor: 'pointer' }}>
								<td>{c.customer?.name || c.customer?.number || c.id}</td>
								<td>{c.assistantId || '-'}</td>
								<td>{c.endedAt && c.startedAt ? `${Math.round((new Date(c.endedAt).getTime() - new Date(c.startedAt).getTime()) / 1000)}s` : '-'}</td>
								<td>{c.status}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Right details panel */}
			<div style={{ borderLeft: '1px solid #eee', paddingLeft: 12 }}>
				<h3>Call Details</h3>
				{selected ? (
					<CallDetails call={selected} onRefresh={() => qc.invalidateQueries({ queryKey: ['calls'] })} />
				) : (
					<div>Select a call to view details</div>
				)}
			</div>
		</div>
	)
}

function CallDetails({ call, onRefresh }: { call: any, onRefresh: () => void }) {
	const { data: artifacts = {} as any } = useQuery<any>({ queryKey: ['artifacts', call.id], queryFn: () => api.getArtifacts(call.id) as any })
	const { data: monitor = {} as any } = useQuery<any>({ queryKey: ['monitor', call.id], queryFn: () => api.getLiveSessionInfo(call.id) as any })
	const [context, setContext] = useState('')

	return (
		<div style={{ display: 'grid', gap: 12 }}>
			<div>
				<div><b>Caller:</b> {call.customer?.name || call.customer?.number || '-'}</div>
				<div><b>Assigned Agent:</b> {call.assistantId || '-'}</div>
				<div><b>Status:</b> {call.status}</div>
			</div>

			<div>
				<h4>Context</h4>
				<textarea rows={4} value={context} onChange={e => setContext(e.target.value)} style={{ width: '100%' }} placeholder="Send real-time context updates to the agent..." />
				<button onClick={async () => { await fetch(`${(api as any).API_BASE ?? ''}/api/calls/${call.id}/context`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(context) }); }}>Update Context</button>
			</div>

			<div>
				<h4>Live Transcript</h4>
				{artifacts?.transcript ? (
					<pre style={{ whiteSpace: 'pre-wrap', maxHeight: 260, overflow: 'auto' }}>{artifacts.transcript}</pre>
				) : <div>Transcript will appear for completed calls with artifacts enabled.</div>}
			</div>

			<div>
				<h4>Recording</h4>
				{artifacts?.recordingUrl ? <audio controls src={artifacts.recordingUrl} /> : <div>No recording available</div>}
			</div>

			<div>
				<h4>Quick Actions</h4>
				<div style={{ display: 'grid', gap: 8 }}>
					{(monitor as any)?.monitor?.listenUrl && (
						<a href={(monitor as any).monitor.listenUrl} target="_blank">Listen In</a>
					)}
					<button onClick={async () => { await fetch(`${(api as any).API_BASE ?? ''}/api/calls/${call.id}/escalate`, { method: 'POST' }); }}>Escalate</button>
					<button onClick={async () => { await fetch(`${(api as any).API_BASE ?? ''}/api/calls/${call.id}/terminate`, { method: 'POST' }); onRefresh(); }}>Terminate Call</button>
				</div>
			</div>
		</div>
	)
}

