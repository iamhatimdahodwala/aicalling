import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import './App.css'
import CallManagementPage from './pages/CallManagementPage'
import AgentsPage from './pages/AgentsPage'
import CallsPage from './pages/CallsPage'
import SchedulePage from './pages/SchedulePage'

function CallDetailRoute() {
	const id = location.pathname.split('/').pop() as string
	return <div>Call Detail: {id}</div>
}

function App() {
	return (
		<BrowserRouter>
			<header style={{ display: 'flex', gap: 16 }}>
				<Link to="/">Dashboard</Link>
				<Link to="/agents">Agents</Link>
				<Link to="/calls">Calls</Link>
				<Link to="/call-management">Call Management</Link>
			</header>
			<Routes>
				<Route path="/" element={<div>Vapi AI Call Management</div>} />
				<Route path="/agents" element={<AgentsPage />} />
				<Route path="/calls" element={<CallsPage />} />
				<Route path="/calls/:id" element={<CallDetailRoute />} />
				<Route path="/call-management" element={<CallManagementPage />} />
				<Route path="/schedule" element={<SchedulePage />} />
			</Routes>
		</BrowserRouter>
	)
}

export default App
