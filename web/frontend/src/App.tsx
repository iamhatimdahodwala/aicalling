import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import CallManagementPage from './pages/CallManagementPage'
import AgentsPage from './pages/AgentsPage'
import CallsPage from './pages/CallsPage'
import SchedulePage from './pages/SchedulePage'
import AppShell from './components/AppShell'

function CallDetailRoute() {
	const id = location.pathname.split('/').pop() as string
	return <div>Call Detail: {id}</div>
}

function App() {
	return (
		<BrowserRouter>
			<AppShell>
				<Routes>
					<Route path="/" element={<CallManagementPage />} />
					<Route path="/agents" element={<AgentsPage />} />
					<Route path="/calls" element={<CallsPage />} />
					<Route path="/calls/:id" element={<CallDetailRoute />} />
					<Route path="/call-management" element={<CallManagementPage />} />
					<Route path="/schedule" element={<SchedulePage />} />
				</Routes>
			</AppShell>
		</BrowserRouter>
	)
}

export default App
