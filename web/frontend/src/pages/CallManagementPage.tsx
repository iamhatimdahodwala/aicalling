import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, API_BASE } from '../lib/api'
import { useMemo, useState } from 'react'
import { Box, Button, Chip, CircularProgress, Divider, Link as MuiLink, Paper, Slider, Stack, Switch, Tab, Tabs, TextField, Typography } from '@mui/material'
import StatusBadge from '../components/StatusBadge'
import { usePcmWebSocketAudio } from '../hooks/usePcmWebSocketAudio'
import { motion } from 'framer-motion'


type TabType = 'active' | 'queued' | 'all'

export default function CallManagementPage() {
	const qc = useQueryClient()
	const { data: agents = [] } = useQuery<any[]>({ queryKey: ['agents'], queryFn: api.listAgents as any })
	const [tab, setTab] = useState<TabType>('active')
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
		<Stack direction="row" alignItems="flex-start" spacing={3} sx={{ position: 'relative' }}>
			{callsLoading && (
				<Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.3)', zIndex: 1 }}>
					<CircularProgress />
				</Box>
			)}
			{/* Left agents panel */}
			<Box sx={{ borderRight: '1px solid', borderColor: 'divider', pr: 2, minWidth: 260 }}>
				<Stack direction="row" justifyContent="space-between" alignItems="center">
					<Typography variant="subtitle1">AI Agents</Typography>
					<Typography variant="body2" color="text.secondary">{agents?.length ?? 0}</Typography>
				</Stack>
				<Stack spacing={1} sx={{ maxHeight: 360, overflowY: 'auto', mt: 1 }}>
					{agents.map((a: any, idx: number) => (
						<motion.div key={a.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 * idx }}>
							<Stack direction="row" spacing={1} sx={{ px: 1, py: 0.5, borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}>
								<Box sx={{ width: 8, height: 8, bgcolor: 'success.main', borderRadius: '50%', flexShrink: 0 }} />
								<Typography variant="body2" sx={{ flex: 1 }} noWrap>{a.name || 'Untitled'}</Typography>
								<Typography variant="caption" color="text.secondary">{a.id.slice(0, 6)}…</Typography>
							</Stack>
						</motion.div>
					))}
				</Stack>
			</Box>

			{/* Center calls table with tabs */}
			<Box sx={{ flex: 1 }}>
				<Tabs value={['active','queued','all'].indexOf(tab)} onChange={(e, i)=>setTab(['active','queued','all'][i] as TabType)}>
					<Tab label="Active Calls" />
					<Tab label="Queue" />
					<Tab label="All" />
				</Tabs>
				<Paper variant="outlined" sx={{ mt: 1 }}>
					<Stack direction="row" spacing={2} sx={{ px: 2, py: 1, bgcolor: 'action.hover' }}>
						<Typography variant="caption" sx={{ flex: 1 }}>Caller</Typography>
						<Typography variant="caption" sx={{ flex: 1 }}>Agent</Typography>
						<Typography variant="caption" sx={{ width: 120 }}>Duration</Typography>
						<Typography variant="caption" sx={{ width: 120 }}>Status</Typography>
					</Stack>
					<Stack>
						{filtered.map((c: any, idx: number) => (
							<motion.div key={c.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.01 * idx }}>
								<Stack direction="row" spacing={2} sx={{ px: 2, py: 1, '&:hover': { bgcolor: 'action.hover' }, cursor: 'pointer' }} onClick={()=>setSelected(c)}>
									<Typography variant="body2" sx={{ flex: 1 }} noWrap>{c.customer?.name || c.customer?.number || c.id}</Typography>
									<Typography variant="body2" sx={{ flex: 1 }} noWrap>{c.assistantId || '-'}</Typography>
									<Typography variant="body2" sx={{ width: 120 }}>{c.endedAt && c.startedAt ? `${Math.round((new Date(c.endedAt).getTime() - new Date(c.startedAt).getTime()) / 1000)}s` : '-'}</Typography>
									<Box sx={{ width: 120 }}><StatusBadge status={c.status} /></Box>
								</Stack>
							</motion.div>
						))}
					</Stack>
				</Paper>
			</Box>

			{/* Right details panel */}
			<Box sx={{ borderLeft: '1px solid', borderColor: 'divider', pl: 2, minWidth: 360 }}>
				<Typography variant="subtitle1">Call Details</Typography>
				{selected ? (
					<CallDetails call={selected} onRefresh={() => qc.invalidateQueries({ queryKey: ['calls'] })} />
				) : (
					<Typography color="text.secondary">Select a call to view details</Typography>
				)}
			</Box>
		</Stack>
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
		<Stack spacing={2} sx={{ mt: 1 }}>
			<Box>
				<Typography variant="body2"><b>Caller:</b> {call.customer?.name || call.customer?.number || '-'}</Typography>
				<Typography variant="body2"><b>Assigned Agent:</b> {call.assistantId || '-'}</Typography>
				<Typography variant="body2"><b>Status:</b> {call.status}</Typography>
			</Box>

			<Box>
				<Typography variant="caption">Context</Typography>
				<TextField multiline minRows={3} value={context} onChange={e => setContext(e.target.value)} placeholder="Send real-time context updates to the agent..." fullWidth />
				<motion.div whileTap={{ scale: 0.98 }}>
					<Button size="small" variant="contained" sx={{ mt: 1 }} onClick={async () => { await fetch(`${API_BASE}/api/calls/${call.id}/context`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(typeof window !== 'undefined' ? { 'x-vapi-token': sessionStorage.getItem('vapi_token') || '' } : {}) }, body: JSON.stringify({ text: context }) }); }}>Update Context</Button>
				</motion.div>
			</Box>

			<Box>
				<Typography variant="caption">Live Transcript</Typography>
				{artifacts?.transcript ? (
					<Box component="pre" sx={{ whiteSpace: 'pre-wrap', maxHeight: 260, overflowY: 'auto' }}>{artifacts.transcript}</Box>
				) : <Typography color="text.secondary">Transcript will appear for completed calls with artifacts enabled.</Typography>}
			</Box>

			<Box>
				<Typography variant="caption">Recording</Typography>
				{artifacts?.recordingUrl ? <audio controls src={artifacts.recordingUrl} /> : <Typography color="text.secondary">No recording available</Typography>}
			</Box>

			<Box>
				<Typography variant="caption">Quick Actions</Typography>
				<Stack>
					{listenAvailable ? (
						<>
							<MuiLink href={(monitor as any).monitor.listenUrl} target="_blank" rel="noreferrer">Listen In (open in provider)</MuiLink>
							<Stack direction="row" spacing={2} alignItems="center">
								<motion.div whileTap={{ scale: 0.98 }}>
									<Button size="small" variant="outlined" onClick={() => connected ? disconnect() : connect()}>{connected ? 'Stop' : 'Listen in app'}</Button>
								</motion.div>
								<Stack direction="row" spacing={1} alignItems="center">
									<Typography variant="body2">Mute</Typography>
									<Switch checked={muted} onChange={e => setMuted(e.target.checked)} />
								</Stack>
							</Stack>
							<Stack direction="row" spacing={2} alignItems="center">
								<Typography variant="body2" sx={{ width: 60 }}>Volume</Typography>
								<Slider value={Math.round(volume * 100)} onChange={(e, v)=>setVolume((v as number)/100)} sx={{ width: 200 }} />
							</Stack>
							<Typography variant="caption" color="text.secondary">Status: {connected ? 'connected' : 'idle'}</Typography>
						</>
					) : (
						<Typography color="text.secondary">Listen In not enabled. Turn on assistant.monitorPlan.listenEnabled.</Typography>
					)}
					<motion.div whileTap={{ scale: 0.98 }}>
						<Button size="small" variant="outlined" onClick={async () => { await fetch(`${API_BASE}/api/calls/${call.id}/escalate`, { method: 'POST', headers: { ...(typeof window !== 'undefined' ? { 'x-vapi-token': sessionStorage.getItem('vapi_token') || '' } : {}) } }); }}>Escalate</Button>
					</motion.div>
					<motion.div whileTap={{ scale: 0.98 }}>
						<Button size="small" color="error" variant="contained" onClick={async () => { await fetch(`${API_BASE}/api/calls/${call.id}/terminate`, { method: 'POST', headers: { ...(typeof window !== 'undefined' ? { 'x-vapi-token': sessionStorage.getItem('vapi_token') || '' } : {}) } }); onRefresh(); }}>Terminate Call</Button>
					</motion.div>
				</Stack>
			</Box>
		</Stack>
	)
}

