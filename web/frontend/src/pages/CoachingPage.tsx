import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Box, Button, MenuItem, Paper, Select, Stack, TextField, Typography } from '@mui/material'
import { useEffect, useMemo, useRef, useState } from 'react'
import { usePcmWebSocketAudio } from '../hooks/usePcmWebSocketAudio'

export default function CoachingPage() {
	const qc = useQueryClient()
	const { data: agents = [] } = useQuery<any[]>({ queryKey: ['agents'], queryFn: api.listAgents as any })
	const agentOptions = useMemo(() => (agents as any[]).map(a => ({ id: a.id, name: a.name || a.id })), [agents])
	const [assistantId, setAssistantId] = useState('')
	const [callId, setCallId] = useState<string>('')
	const [whisper, setWhisper] = useState('')
	const [insights, setInsights] = useState('')
	const [liveTranscript, setLiveTranscript] = useState('')
	const vapiRef = useRef<any | null>(null)
	const [sdkReady, setSdkReady] = useState(false)

	useEffect(() => {
		(async () => {
			const publicKey = sessionStorage.getItem('vapi_public_key') || import.meta.env.VITE_VAPI_PUBLIC_KEY
			if (!publicKey) { console.warn('Missing VAPI public key: set sessionStorage vapi_public_key or VITE_VAPI_PUBLIC_KEY'); return }
			// Load from CDN to avoid local package resolution issues
			const mod = await import(/* @vite-ignore */ 'https://unpkg.com/@vapi-ai/web@latest/dist/index.mjs')
			const VapiCtor = mod.default
			const v = new VapiCtor(publicKey)
			vapiRef.current = v
			v.on('call-start', (payload: any) => { setCallId(payload?.id || '') })
			v.on('message', (m: any) => {
				try {
					const role = m?.role || ''
					const content = m?.content || ''
					if (content) setLiveTranscript(t => (t ? t + '\n' : '') + `${role}: ${content}`)
				} catch {}
			})
			v.on('call-end', async () => {
				const transcript = liveTranscript
				if (transcript) {
					try { const res: any = await (api as any).compareInsightsTranscript(transcript); setInsights(res.analysis || '') } catch {}
				}
				setCallId('')
				setLiveTranscript('')
			})
			setSdkReady(true)
		})()
		return () => { try { vapiRef.current?.removeAllListeners?.() } catch {} }
	}, [])

	const start = async () => {
		if (!assistantId || !sdkReady || !vapiRef.current) { alert('Select an agent and ensure SDK key is configured'); return }
		setInsights(''); setLiveTranscript('')
		await vapiRef.current.start({ assistantId })
	}
	const end = async () => {
		try { await vapiRef.current?.stop() } catch {}
	}

	return (
		<Stack spacing={2}>
			<Typography variant="h6">Coaching</Typography>
			<Paper variant="outlined" sx={{ p: 2 }}>
				<Typography variant="subtitle2">Place Web Call</Typography>
				<Stack direction="row" spacing={1} sx={{ mt: 1 }}>
					<Select size="small" displayEmpty value={assistantId} onChange={e => setAssistantId(e.target.value as string)} sx={{ minWidth: 260 }}>
						<MenuItem value=""><em>Select agent</em></MenuItem>
						{agentOptions.map(a => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
					</Select>
					<Button size="small" variant="contained" onClick={start} disabled={!assistantId}>Start</Button>
					<Button size="small" color="error" variant="outlined" onClick={end} disabled={!assistantId}>End</Button>
				</Stack>
			</Paper>
			<Paper variant="outlined" sx={{ p: 2 }}>
				<Typography variant="subtitle2">Live Transcript</Typography>
				<Box component="pre" sx={{ whiteSpace: 'pre-wrap', maxHeight: 260, overflowY: 'auto', mt: 1 }}>{liveTranscript}</Box>
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