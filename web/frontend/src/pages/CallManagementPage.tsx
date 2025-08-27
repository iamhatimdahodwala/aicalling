import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, API_BASE } from '../lib/api'
import { useMemo, useState } from 'react'
import { Box, Button, Heading, HStack, Tab, TabList, TabPanel, TabPanels, Tabs, Text, Textarea, VStack, Link as CLink, Spinner } from '@chakra-ui/react'
import { Slider, SliderTrack, SliderFilledTrack, SliderThumb, Switch } from '@chakra-ui/react'
import StatusBadge from '../components/StatusBadge'
import { usePcmWebSocketAudio } from '../hooks/usePcmWebSocketAudio'
import { motion } from 'framer-motion'


type Tab = 'active' | 'queued' | 'all'

export default function CallManagementPage() {
	const qc = useQueryClient()
	const { data: agents = [] } = useQuery<any[]>({ queryKey: ['agents'], queryFn: api.listAgents as any })
	const [tab, setTab] = useState<Tab>('active')
	const { data: calls = [], isLoading: callsLoading } = useQuery<any[]>({ queryKey: ['calls', tab], queryFn: api.listCalls as any })
	const [selected, setSelected] = useState<any | null>(null)

	const filtered = useMemo(() => {
		if (!calls) return []
		if (tab === 'all') return calls
		if (tab === 'active') return calls.filter((c: any) => (c.status || '').toLowerCase() === 'active')
		if (tab === 'queued') return calls.filter((c: any) => (c.status || '').toLowerCase() === 'queued')
		return calls
	}, [calls, tab])

	return (
		<HStack align="start" spacing={4} position="relative">
			{callsLoading && (
				<Box position="absolute" inset={0} display="flex" alignItems="center" justifyContent="center" bg="blackAlpha.400" zIndex={1}>
					<Spinner size="lg" />
				</Box>
			)}
			{/* Left agents panel */}
			<Box borderRight="1px" borderColor="whiteAlpha.300" pr={3} minW="260px">
				<HStack justify="space-between" align="center">
					<Heading size="sm">AI Agents</Heading>
					<Text opacity={0.7}>{agents?.length ?? 0}</Text>
				</HStack>
				<VStack align="stretch" maxH="360px" overflowY="auto" mt={3} spacing={2}>
					{agents.map((a: any, idx: number) => (
						<motion.div key={a.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 * idx }}>
							<HStack px={2} py={1} _hover={{ bg: 'whiteAlpha.100' }} borderRadius="md" spacing={2}>
								<Box w="8px" h="8px" bg="green.400" borderRadius="full" flexShrink={0} />
								<Text flex="1" noOfLines={1}>{a.name || 'Untitled'}</Text>
								<Text opacity={0.6} fontSize="sm">{a.id.slice(0, 6)}…</Text>
							</HStack>
						</motion.div>
					))}
				</VStack>
			</Box>

			{/* Center calls table with tabs */}
			<Box flex="1">
				<Tabs index={['active','queued','all'].indexOf(tab)} onChange={(i)=>setTab(['active','queued','all'][i] as Tab)}>
					<TabList>
						<Tab>Active Calls</Tab>
						<Tab>Queue</Tab>
						<Tab>All</Tab>
					</TabList>
					<TabPanels>
						<TabPanel px={0}>
							<VStack align="stretch" spacing={0} border="1px" borderColor="whiteAlpha.300" borderRadius="md" overflow="hidden">
								<HStack bg="whiteAlpha.200" px={3} py={2}>
									<Text flex="1">Caller</Text>
									<Text flex="1">Agent</Text>
									<Text w="120px">Duration</Text>
									<Text w="120px">Status</Text>
								</HStack>
								<VStack align="stretch" spacing={0}>
									{filtered.map((c: any, idx: number) => (
										<motion.div key={c.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.01 * idx }}>
											<HStack px={3} py={2} _hover={{ bg: 'whiteAlpha.100' }} onClick={()=>setSelected(c)} cursor="pointer">
												<Text flex="1" noOfLines={1}>{c.customer?.name || c.customer?.number || c.id}</Text>
												<Text flex="1" noOfLines={1}>{c.assistantId || '-'}</Text>
												<Text w="120px">{c.endedAt && c.startedAt ? `${Math.round((new Date(c.endedAt).getTime() - new Date(c.startedAt).getTime()) / 1000)}s` : '-'}</Text>
												<Box w="120px"><StatusBadge status={c.status} /></Box>
											</HStack>
										</motion.div>
									))}
								</VStack>
							</VStack>
						</TabPanel>
						<TabPanel px={0}><Text opacity={0.7}>Queue view shows calls in queued status.</Text></TabPanel>
						<TabPanel px={0}>
							<VStack align="stretch" spacing={0} border="1px" borderColor="whiteAlpha.300" borderRadius="md" overflow="hidden">
								<HStack bg="whiteAlpha.200" px={3} py={2}>
									<Text flex="1">Caller</Text>
									<Text flex="1">Agent</Text>
									<Text w="120px">Duration</Text>
									<Text w="120px">Status</Text>
								</HStack>
								<VStack align="stretch" spacing={0}>
									{(calls || []).map((c: any, idx: number) => (
										<motion.div key={c.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.005 * idx }}>
											<HStack px={3} py={2} _hover={{ bg: 'whiteAlpha.100' }} onClick={()=>setSelected(c)} cursor="pointer">
												<Text flex="1" noOfLines={1}>{c.customer?.name || c.customer?.number || c.id}</Text>
												<Text flex="1" noOfLines={1}>{c.assistantId || '-'}</Text>
												<Text w="120px">{c.endedAt && c.startedAt ? `${Math.round((new Date(c.endedAt).getTime() - new Date(c.startedAt).getTime()) / 1000)}s` : '-'}</Text>
												<Text w="120px">{c.status}</Text>
											</HStack>
										</motion.div>
									))}
								</VStack>
							</VStack>
						</TabPanel>
					</TabPanels>
				</Tabs>
			</Box>

			{/* Right details panel */}
			<Box borderLeft="1px" borderColor="whiteAlpha.300" pl={3} minW="360px">
				<Heading size="sm">Call Details</Heading>
				{selected ? (
					<CallDetails call={selected} onRefresh={() => qc.invalidateQueries({ queryKey: ['calls'] })} />
				) : (
					<Text opacity={0.7}>Select a call to view details</Text>
				)}
			</Box>
		</HStack>
	)
}

function CallDetails({ call, onRefresh }: { call: any, onRefresh: () => void }) {
	const { data: artifacts = {} as any } = useQuery<any>({ queryKey: ['artifacts', call.id], queryFn: () => api.getArtifacts(call.id) as any })
	const { data: monitor = {} as any } = useQuery<any>({ queryKey: ['monitor', call.id], queryFn: () => api.getLiveSessionInfo(call.id) as any })
	const [context, setContext] = useState('')

	const listenAvailable = Boolean((monitor as any)?.monitor?.listenUrl)
    const listenUrl = (monitor as any)?.monitor?.listenUrl as string | undefined
    const { connected, muted, volume, setMuted, setVolume, connect, disconnect } = usePcmWebSocketAudio(listenUrl)

	return (
		<VStack align="stretch" spacing={3} mt={3}>
			<Box>
				<Text><b>Caller:</b> {call.customer?.name || call.customer?.number || '-'}</Text>
				<Text><b>Assigned Agent:</b> {call.assistantId || '-'}</Text>
				<Text><b>Status:</b> {call.status}</Text>
			</Box>

			<Box>
				<Heading size="xs" mb={1}>Context</Heading>
				<Textarea rows={4} value={context} onChange={e => setContext(e.target.value)} placeholder="Send real-time context updates to the agent..." />
				<motion.div whileTap={{ scale: 0.98 }}>
					<Button size="sm" mt={2} onClick={async () => { await fetch(`${API_BASE}/api/calls/${call.id}/context`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(typeof window !== 'undefined' ? { 'x-vapi-token': sessionStorage.getItem('vapi_token') || '' } : {}) }, body: JSON.stringify({ text: context }) }); }}>Update Context</Button>
				</motion.div>
			</Box>

			<Box>
				<Heading size="xs" mb={1}>Live Transcript</Heading>
				{artifacts?.transcript ? (
					<Box as="pre" whiteSpace="pre-wrap" maxH="260px" overflowY="auto">{artifacts.transcript}</Box>
				) : <Text opacity={0.7}>Transcript will appear for completed calls with artifacts enabled.</Text>}
			</Box>

			<Box>
				<Heading size="xs" mb={1}>Recording</Heading>
				{artifacts?.recordingUrl ? <audio controls src={artifacts.recordingUrl} /> : <Text opacity={0.7}>No recording available</Text>}
			</Box>

			<Box>
				<Heading size="xs" mb={1}>Quick Actions</Heading>
				<VStack align="stretch">
					{listenAvailable ? (
						<>
							<CLink href={(monitor as any).monitor.listenUrl} isExternal>Listen In (open in provider)</CLink>
							<HStack>
								<motion.div whileTap={{ scale: 0.98 }}>
									<Button size="sm" onClick={() => connected ? disconnect() : connect()}>{connected ? 'Stop' : 'Listen in app'}</Button>
								</motion.div>
								<HStack>
									<Text fontSize="sm">Mute</Text>
									<Switch isChecked={muted} onChange={e => setMuted(e.target.checked)} />
								</HStack>
							</HStack>
							<HStack>
								<Text fontSize="sm" w="60px">Volume</Text>
								<Slider value={Math.round(volume * 100)} onChange={(v)=>setVolume(v/100)} w="200px">
									<SliderTrack><SliderFilledTrack /></SliderTrack>
									<SliderThumb />
								</Slider>
							</HStack>
							<Text fontSize="xs" opacity={0.7}>Status: {connected ? 'connected' : 'idle'}</Text>
						</>
					) : (
						<Text opacity={0.7}>Listen In not enabled. Turn on assistant.monitorPlan.listenEnabled.</Text>
					)}
					<motion.div whileTap={{ scale: 0.98 }}>
						<Button size="sm" onClick={async () => { await fetch(`${API_BASE}/api/calls/${call.id}/escalate`, { method: 'POST', headers: { ...(typeof window !== 'undefined' ? { 'x-vapi-token': sessionStorage.getItem('vapi_token') || '' } : {}) } }); }}>Escalate</Button>
					</motion.div>
					<motion.div whileTap={{ scale: 0.98 }}>
						<Button size="sm" colorScheme="red" onClick={async () => { await fetch(`${API_BASE}/api/calls/${call.id}/terminate`, { method: 'POST', headers: { ...(typeof window !== 'undefined' ? { 'x-vapi-token': sessionStorage.getItem('vapi_token') || '' } : {}) } }); onRefresh(); }}>Terminate Call</Button>
					</motion.div>
				</VStack>
			</Box>
		</VStack>
	)
}

