import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useMemo, useState } from 'react'
import { Box, Button, Heading, HStack, Tab, TabList, TabPanel, TabPanels, Tabs, Text, Textarea, VStack, Link as CLink } from '@chakra-ui/react'
import StatusBadge from '../components/StatusBadge'

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
		<HStack align="start" spacing={4}>
			{/* Left agents panel */}
			<Box borderRight="1px" borderColor="whiteAlpha.300" pr={3} minW="260px">
				<HStack justify="space-between" align="center">
					<Heading size="sm">AI Agents</Heading>
					<Text opacity={0.7}>{agents?.length ?? 0}</Text>
				</HStack>
				<VStack align="stretch" maxH="360px" overflowY="auto" mt={3} spacing={2}>
					{agents.map((a: any) => (
						<HStack key={a.id} justify="space-between" px={2} py={1} _hover={{ bg: 'whiteAlpha.100' }} borderRadius="md">
							<Text noOfLines={1}>{a.name || 'Untitled'}</Text>
							<Text opacity={0.6}>id:{a.id.slice(0, 6)}…</Text>
						</HStack>
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
									{filtered.map((c: any) => (
										<HStack key={c.id} px={3} py={2} _hover={{ bg: 'whiteAlpha.100' }} onClick={()=>setSelected(c)} cursor="pointer">
											<Text flex="1" noOfLines={1}>{c.customer?.name || c.customer?.number || c.id}</Text>
											<Text flex="1" noOfLines={1}>{c.assistantId || '-'}</Text>
											<Text w="120px">{c.endedAt && c.startedAt ? `${Math.round((new Date(c.endedAt).getTime() - new Date(c.startedAt).getTime()) / 1000)}s` : '-'}</Text>
											<Box w="120px"><StatusBadge status={c.status} /></Box>
										</HStack>
									))}
								</VStack>
							</VStack>
						</TabPanel>
						<TabPanel px={0}><Text opacity={0.7}>Queue view mirrors Active; populate when statuses are queued.</Text></TabPanel>
						<TabPanel px={0}><Text opacity={0.7}>All calls listed above when tab is All.</Text></TabPanel>
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
				<Button size="sm" mt={2} onClick={async () => { await fetch(`${(api as any).API_BASE ?? ''}/api/calls/${call.id}/context`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(context) }); }}>Update Context</Button>
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
						<CLink href={(monitor as any).monitor.listenUrl} isExternal>Listen In</CLink>
					) : (
						<Text opacity={0.7}>Listen In not enabled. Turn on assistant.monitorPlan.listenEnabled.</Text>
					)}
					<Button size="sm" onClick={async () => { await fetch(`${(api as any).API_BASE ?? ''}/api/calls/${call.id}/escalate`, { method: 'POST' }); }}>Escalate</Button>
					<Button size="sm" colorScheme="red" onClick={async () => { await fetch(`${(api as any).API_BASE ?? ''}/api/calls/${call.id}/terminate`, { method: 'POST' }); onRefresh(); }}>Terminate Call</Button>
				</VStack>
			</Box>
		</VStack>
	)
}

