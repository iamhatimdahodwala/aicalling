import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Box, Button, MenuItem, Paper, Select, Stack, TextField, Typography } from '@mui/material'
import { useEffect, useMemo, useRef, useState } from 'react'
import Vapi from '@vapi-ai/web'

export default function CoachingPage() {
	const qc = useQueryClient()
	const { data: agents = [] } = useQuery<any[]>({ queryKey: ['agents'], queryFn: api.listAgents as any })
	const agentOptions = useMemo(() => (agents as any[]).map(a => ({ id: a.id, name: a.name || a.id })), [agents])
	const [assistantId, setAssistantId] = useState('')
	const [callId, setCallId] = useState<string>('')
	const [insights, setInsights] = useState('')
	const [liveTranscript, setLiveTranscript] = useState('')
	const [errorText, setErrorText] = useState('')
	const vapiRef = useRef<any | null>(null)
	const [sdkReady, setSdkReady] = useState(false)
	const [pubKeyInput, setPubKeyInput] = useState(sessionStorage.getItem('vapi_public_key') || '')
	const [sdkNonce, setSdkNonce] = useState(0)

	useEffect(() => {
		const publicKey = sessionStorage.getItem('vapi_public_key') || import.meta.env.VITE_VAPI_PUBLIC_KEY
		if (!publicKey) { setSdkReady(false); return }
		try {
			const v = new Vapi(publicKey)
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
			v.on('error', (e: any) => {
				try {
					const msg = e?.error?.message || e?.message
					setErrorText(Array.isArray(msg) ? msg.join('\n') : (msg ? String(msg) : JSON.stringify(e)))
				} catch { setErrorText(String(e)) }
			})
			setSdkReady(true)
		} catch (e: any) {
			setSdkReady(false)
			setErrorText(String(e?.message || e))
		}
		return () => { try { vapiRef.current?.removeAllListeners?.() } catch {} }
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pubKeyInput, sdkNonce])

	const savePublicKey = () => {
		if (!pubKeyInput) return
		sessionStorage.setItem('vapi_public_key', pubKeyInput)
		setSdkReady(false)
		setSdkNonce(n => n + 1)
	}

	const start = async () => {
		if (!assistantId || !sdkReady || !vapiRef.current) { alert('Select an agent and ensure SDK key is configured'); return }
		setInsights(''); setLiveTranscript(''); setErrorText('')
		try {
			await vapiRef.current.start({ assistant: assistantId })
		} catch (e: any) {
			try {
				const msg = e?.error?.message || e?.message
				setErrorText(Array.isArray(msg) ? msg.join('\n') : (msg ? String(msg) : JSON.stringify(e)))
			} catch { setErrorText(String(e)) }
		}
	}
	const end = async () => {
		try { await vapiRef.current?.stop() } catch {}
	}

	return (
		<Stack spacing={2}>
			<Typography variant="h6">Coaching</Typography>
			<Paper variant="outlined" sx={{ p: 2 }}>
				<Typography variant="subtitle2">Vapi Public Key</Typography>
				<Stack direction="row" spacing={1} sx={{ mt: 1 }}>
					<TextField fullWidth placeholder="pk_..." value={pubKeyInput} onChange={e => setPubKeyInput(e.target.value)} />
					<Button variant="contained" size="small" onClick={savePublicKey} disabled={!pubKeyInput}>Save</Button>
					<Typography variant="caption" sx={{ alignSelf: 'center' }}>SDK: {sdkReady ? 'Ready' : 'Not loaded'}</Typography>
				</Stack>
				<Typography variant="caption" color="text.secondary">Ensure your public key allows http://localhost:5173 in the Vapi dashboard or set VITE_VAPI_PUBLIC_KEY in .env.local.</Typography>
			</Paper>
			<Paper variant="outlined" sx={{ p: 2 }}>
				<Typography variant="subtitle2">Place Web Call</Typography>
				<Stack direction="row" spacing={1} sx={{ mt: 1 }}>
					<Select size="small" displayEmpty value={assistantId} onChange={e => setAssistantId(e.target.value as string)} sx={{ minWidth: 260 }}>
						<MenuItem value=""><em>Select agent</em></MenuItem>
						{agentOptions.map(a => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
					</Select>
					<Button size="small" variant="contained" onClick={start} disabled={!assistantId || !sdkReady}>Start</Button>
					<Button size="small" color="error" variant="outlined" onClick={end} disabled={!assistantId || !sdkReady}>End</Button>
				</Stack>
				{errorText && <Box component="pre" sx={{ whiteSpace: 'pre-wrap', color: 'salmon', mt: 1 }}>{errorText}</Box>}
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