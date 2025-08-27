import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useMemo, useState } from 'react'

export default function CallsPage() {
	const { data = [] } = useQuery<any[]>({ queryKey: ['calls'], queryFn: api.listCalls as any })
	const [selected, setSelected] = useState<any | null>(null)
	const filtered = useMemo(() => data || [], [data])

	return (
		<div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
			<div>
				<h2>Calls</h2>
				<table>
					<thead><tr><th>Caller</th><th>Status</th><th>Duration</th></tr></thead>
					<tbody>
						{filtered.map((c: any) => (
							<tr key={c.id} onClick={() => setSelected(c)} style={{ cursor: 'pointer' }}>
								<td>{c.customer?.name || c.customer?.number || c.id}</td>
								<td>{c.status}</td>
								<td>{c.endedAt && c.startedAt ? `${Math.round((new Date(c.endedAt).getTime() - new Date(c.startedAt).getTime()) / 1000)}s` : '-'}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<div>
				{selected ? <CallDetail call={selected} /> : <div>Select a call</div>}
			</div>
		</div>
	)
}

function CallDetail({ call }: { call: any }) {
	const { data = {} as any } = useQuery<any>({ queryKey: ['artifacts', call.id], queryFn: () => api.getArtifacts(call.id) as any })
	return (
		<div>
			<h3>Call Detail</h3>
			<div><b>Id:</b> {call.id}</div>
			<div><b>Status:</b> {call.status}</div>
			<hr />
			{data?.transcript && (
				<div>
					<h4>Transcript</h4>
					<pre style={{ whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto' }}>{data.transcript}</pre>
				</div>
			)}
			{data?.recordingUrl && (
				<div>
					<h4>Recording</h4>
					<audio controls src={data.recordingUrl} />
				</div>
			)}
		</div>
	)
}

