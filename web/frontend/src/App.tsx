import { BrowserRouter, Link, Route, Routes, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from './lib/api'
import './App.css'

function Agents() {
	const { data } = useQuery({ queryKey: ['agents'], queryFn: api.listAgents })
	return (
		<div>
			<h2>Agents</h2>
			<ul>
				{data?.map((a: any) => (
					<li key={a.id}>{a.name || a.id}</li>
				))}
			</ul>
		</div>
	)
}

function Calls() {
	const nav = useNavigate()
	const { data } = useQuery({ queryKey: ['calls'], queryFn: api.listCalls })
	return (
		<div>
			<h2>Calls</h2>
			<table>
				<thead>
					<tr><th>Id</th><th>Status</th><th>Started</th></tr>
				</thead>
				<tbody>
					{data?.map((c: any) => (
						<tr key={c.id} onClick={() => nav(`/calls/${c.id}`)} style={{ cursor: 'pointer' }}>
							<td>{c.id}</td>
							<td>{c.status}</td>
							<td>{c.startedAt}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}

function CallDetail({ id }: { id: string }) {
	const { data } = useQuery({ queryKey: ['call', id], queryFn: () => api.getArtifacts(id) })
	return (
		<div>
			<h3>Call {id}</h3>
			{data?.transcript && <pre style={{ whiteSpace: 'pre-wrap' }}>{data.transcript}</pre>}
			{data?.recordingUrl && (
				<audio controls src={data.recordingUrl} />
			)}
		</div>
	)
}

function CallDetailRoute() {
	const id = location.pathname.split('/').pop() as string
	return <CallDetail id={id} />
}

function App() {
	return (
		<BrowserRouter>
			<header style={{ display: 'flex', gap: 16 }}>
				<Link to="/">Dashboard</Link>
				<Link to="/agents">Agents</Link>
				<Link to="/calls">Calls</Link>
			</header>
			<Routes>
				<Route path="/" element={<div>Vapi AI Call Management</div>} />
				<Route path="/agents" element={<Agents />} />
				<Route path="/calls" element={<Calls />} />
				<Route path="/calls/:id" element={<CallDetailRoute />} />
			</Routes>
		</BrowserRouter>
	)
}

export default App
