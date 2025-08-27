import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Text } from '@chakra-ui/react'
import './App.css'
import CallManagementPage from './pages/CallManagementPage'
import AgentsPage from './pages/AgentsPage'
import CallsPage from './pages/CallsPage'
import SchedulePage from './pages/SchedulePage'
import AppShell from './components/AppShell'
import { AnimatePresence, motion } from 'framer-motion'

function CallDetailRoute() {
	const id = location.pathname.split('/').pop() as string
	return <div>Call Detail: {id}</div>
}

function RoutesWithAnimation() {
	const location = useLocation()
	return (
		<AnimatePresence mode="wait">
			<motion.div key={location.pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18, ease: 'easeOut' }}>
				<Routes location={location}>
					<Route path="/" element={<CallManagementPage />} />
					<Route path="/agents" element={<AgentsPage />} />
					<Route path="/calls" element={<CallsPage />} />
					<Route path="/calls/:id" element={<CallDetailRoute />} />
					<Route path="/call-management" element={<CallManagementPage />} />
					<Route path="/schedule" element={<SchedulePage />} />
				</Routes>
			</motion.div>
		</AnimatePresence>
	)
}

function App() {
	const [token, setToken] = useState('')
	const [askToken, setAskToken] = useState(false)
	useEffect(() => {
		const t = sessionStorage.getItem('vapi_token')
		if (!t) setAskToken(true)
	}, [])
	const saveToken = () => {
		if (token) sessionStorage.setItem('vapi_token', token)
		setAskToken(false)
	}
	return (
		<BrowserRouter>
			<AppShell>
				<RoutesWithAnimation />
			</AppShell>
			<Modal isOpen={askToken} onClose={()=>{}} isCentered size="xl">
				<ModalOverlay bg="blackAlpha.700" backdropFilter="blur(2px)" />
				<ModalContent bg="gray.900" color="white" border="1px solid" borderColor="whiteAlpha.300">
					<ModalHeader>Enter Vapi API Token</ModalHeader>
					<ModalBody>
						<Text mb={3} opacity={0.9}>This token will be used for this session and not saved on the server.</Text>
						<Input type="password" placeholder="sk_..." value={token} onChange={e => setToken(e.target.value)} />
					</ModalBody>
					<ModalFooter>
						<Button colorScheme="blue" onClick={saveToken} isDisabled={!token}>Continue</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</BrowserRouter>
	)
}

export default App
