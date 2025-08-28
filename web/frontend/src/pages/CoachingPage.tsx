import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Box, Button, Paper, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { usePcmWebSocketAudio } from '../hooks/usePcmWebSocketAudio'

export default function CoachingPage() {
	const { data: calls = [] } = useQuery<any[]>({ queryKey: ['calls'], queryFn: api.listCalls as any })
	const [callId, setCallId] = useState<string>('')
	const [whisper, setWhisper] = useState('')
	const [humanText, setHumanText] = useState('')
	const [aiText, setAiText] = useState('')
	const [insights, setInsights] = useState('')
	const selected = (calls as any[]).find(c => c.id === callId)
	const { data: monitor = {} as any } = useQuery<any>({ enabled: !!callId, queryKey: ['monitor', callId], queryFn: () => api.getLiveSessionInfo(callId) as any })
	const listenUrl = (monitor as any)?.monitor?.listenUrl as string | undefined
	const { connected, connect, disconnect } = usePcmWebSocketAudio(listenUrl)

	return (
		<Stack spacing={2}>
			<Typography variant="h6">Coaching</Typography>
			<TextField label="Active Call ID" value={callId} onChange={e => setCallId(e.target.value)} placeholder="Paste an active call id" fullWidth />
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
				<Typography variant="subtitle2">Whisper to Agent</Typography>
				<Stack direction="row" spacing={1} sx={{ mt: 1 }}>
					<TextField fullWidth placeholder="Coach message" value={whisper} onChange={e => setWhisper(e.target.value)} />
					<Button variant="contained" size="small" onClick={async () => { if (!callId || !whisper) return; await (api as any).coachSession(callId, whisper); setWhisper('') }}>Send</Button>
				</Stack>
			</Paper>
			<Paper variant="outlined" sx={{ p: 2 }}>
				<Typography variant="subtitle2">Human vs AI Insights (Azure OpenAI)</Typography>
				<Stack spacing={1} sx={{ mt: 1 }}>
					<TextField label="Human response" value={humanText} onChange={e => setHumanText(e.target.value)} fullWidth multiline minRows={3} />
					<TextField label="AI response" value={aiText} onChange={e => setAiText(e.target.value)} fullWidth multiline minRows={3} />
					<Button variant="outlined" size="small" onClick={async () => { const r: any = await (api as any).compareInsights(humanText, aiText); setInsights(r.analysis || '') }}>Compare</Button>
					{insights && <Box component="pre" sx={{ whiteSpace: 'pre-wrap' }}>{insights}</Box>}
				</Stack>
			</Paper>
		</Stack>
	)
}