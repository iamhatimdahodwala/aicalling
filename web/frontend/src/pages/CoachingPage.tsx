import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Box, Button, MenuItem, Paper, Select, Stack, TextField, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { usePcmWebSocketAudio } from '../hooks/usePcmWebSocketAudio'

export default function CoachingPage() {
	const qc = useQueryClient()
	const { data: agents = [] } = useQuery<any[]>({ queryKey: ['agents'], queryFn: api.listAgents as any })
	const [assistantId, setAssistantId] = useState('')
	const [callId, setCallId] = useState<string>('')
	const [whisper, setWhisper] = useState('')
	const [insights, setInsights] = useState('')
	const { data: monitor = {} as any } = useQuery<any>({ enabled: !!callId, queryKey: ['monitor', callId], queryFn: () => api.getLiveSessionInfo(callId) as any })
	const listenUrl = (monitor as any)?.monitor?.listenUrl as string | undefined
	const { connected, connect, disconnect } = usePcmWebSocketAudio(listenUrl)
	const { data: artifacts = {} as any, refetch: refetchArtifacts } = useQuery<any>({ enabled: !!callId, queryKey: ['artifacts', callId], queryFn: () => api.getArtifacts(callId) as any })

	useEffect(() => {
		if (!callId) return
		const t = setInterval(() => { refetchArtifacts() }, 1500)
		return () => clearInterval(t)
	}, [callId])

	const start = async () => {
		if (!assistantId) { alert('Select an agent'); return }
		const c: any = await (api as any).startWebCall(assistantId, 'Web Trainee')
		setCallId(c.id)
		setInsights('')
	}
	const end = async () => {
		if (!callId) return
		await (api as any).endWebCall(callId)
		const latest: any = await (api as any).getArtifacts(callId)
		if (latest?.transcript) {
			const res: any = await (api as any).compareInsightsTranscript(latest.transcript)
			setInsights(res.analysis || '')
		}
	}

	return (
		<Stack spacing={2}>
			<Typography variant="h6">Coaching</Typography>
			<Paper variant="outlined" sx={{ p: 2 }}>
				<Typography variant="subtitle2">Place Web Call</Typography>
				<Stack direction="row" spacing={1} sx={{ mt: 1 }}>
					<Select size="small" displayEmpty value={assistantId} onChange={e => setAssistantId(e.target.value as string)} sx={{ minWidth: 260 }}>
						<MenuItem value=""><em>Select agent</em></MenuItem>
						{(agents as any[]).map((a: any) => <MenuItem key={a.id} value={a.id}>{a.name || a.id}</MenuItem>)}
					</Select>
					<Button size="small" variant="contained" onClick={start} disabled={!assistantId || !!callId}>Start</Button>
					<Button size="small" color="error" variant="outlined" onClick={end} disabled={!callId}>End</Button>
				</Stack>
			</Paper>
			{listenUrl && (
				<Paper variant="outlined" sx={{ p: 2 }}>
					<Typography variant="subtitle2">Listen In</Typography>
					<Stack direction="row" spacing={1} sx={{ mt: 1 }}>
						<Button size="small" variant="outlined" onClick={() => connected ? disconnect() : connect()}>{connected ? 'Stop' : 'Listen in app'}</Button>
						<a href={listenUrl} target="_blank" rel="noreferrer">Open provider monitor</a>
					</Stack>
				</Paper>
			)}
			<Paper variant="outlined" sx={{ p: 2 }}>
				<Typography variant="subtitle2">Live Transcript</Typography>
				<Box component="pre" sx={{ whiteSpace: 'pre-wrap', maxHeight: 260, overflowY: 'auto', mt: 1 }}>{artifacts?.transcript || ''}</Box>
			</Paper>
			<Paper variant="outlined" sx={{ p: 2 }}>
				<Typography variant="subtitle2">Whisper to Agent</Typography>
				<Stack direction="row" spacing={1} sx={{ mt: 1 }}>
					<TextField fullWidth placeholder="Coach message" value={whisper} onChange={e => setWhisper(e.target.value)} />
					<Button variant="contained" size="small" onClick={async () => { if (!callId || !whisper) return; await (api as any).coachSession(callId, whisper); setWhisper('') }}>Send</Button>
				</Stack>
			</Paper>
			{insights && (
				<Paper variant="outlined" sx={{ p: 2 }}>
					<Typography variant="subtitle2">Post-call Insights</Typography>
					<Box component="pre" sx={{ whiteSpace: 'pre-wrap' }}>{insights}</Box>
				</Paper>
			)}
		</Stack>
	)
}