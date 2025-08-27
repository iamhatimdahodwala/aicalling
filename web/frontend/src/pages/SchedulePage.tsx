import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useRef, useState } from 'react'
import { Box, Button, MenuItem, Paper, Select, Stack, TextField, Typography } from '@mui/material'

export default function SchedulePage() {
	const { data: agents = [], isLoading: agentsLoading } = useQuery<any[]>({ queryKey: ['agents'], queryFn: api.listAgents as any })
	const [assistantId, setAssistantId] = useState('')
	const [name, setName] = useState('')
	const [number, setNumber] = useState('')
	const [earliest, setEarliest] = useState('')
	const [latest, setLatest] = useState('')
	const [context, setContext] = useState('')
	const fileRef = useRef<HTMLInputElement>(null)

	const onScheduleSingle = async () => {
		if (!assistantId || !number || !earliest) { alert('Assistant, number and earliest time are required'); return }
		await api.scheduleSingle({ assistant_id: assistantId, name: name || undefined, number, earliest_at: earliest, latest_at: latest || undefined, context: context || undefined } as any)
		alert('Call scheduled')
	}
	const onUpload = async () => {
		const f = fileRef.current?.files?.[0]
		if (!assistantId || !f) { alert('Assistant and file required'); return }
		await api.scheduleUpload(assistantId, f)
		alert('Bulk calls scheduled')
	}

	return (
		<Stack spacing={3}>
			<Typography variant="h6">Schedule Calls</Typography>
			<Stack direction="row" spacing={3} alignItems="flex-start">
				<Box sx={{ flex: 1 }}>
					<Typography variant="subtitle2" sx={{ mb: 1 }}>Single Call</Typography>
					<Paper variant="outlined" sx={{ p: 2 }}>
						<Stack spacing={2}>
							<div>
								<Typography variant="caption">Assistant</Typography>
								<Select fullWidth displayEmpty value={assistantId} onChange={e => setAssistantId(e.target.value as string)}>
									<MenuItem value=""><em>Select assistant</em></MenuItem>
									{agents.map((a: any) => <MenuItem key={a.id} value={a.id}>{a.name || a.id}</MenuItem>)}
								</Select>
								{agentsLoading && <Typography color="text.secondary">Loading assistants…</Typography>}
							</div>
							<TextField label="Customer Name (optional)" value={name} onChange={e => setName(e.target.value)} placeholder="John Smith" fullWidth />
							<TextField label="Customer Number" value={number} onChange={e => setNumber(e.target.value)} placeholder="+14155551234" fullWidth />
							<Stack direction="row" spacing={2}>
								<TextField label="Earliest At" type="datetime-local" value={earliest} onChange={e => setEarliest(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
								<TextField label="Latest At (optional)" type="datetime-local" value={latest} onChange={e => setLatest(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
							</Stack>
							<TextField label="Call Context (optional)" value={context} onChange={e => setContext(e.target.value)} placeholder="Why are we calling?" fullWidth multiline minRows={3} />
							<Button variant="contained" onClick={onScheduleSingle}>Schedule</Button>
						</Stack>
					</Paper>
				</Box>
				<Box sx={{ flex: 1 }}>
					<Typography variant="subtitle2" sx={{ mb: 1 }}>Bulk Upload</Typography>
					<Paper variant="outlined" sx={{ p: 2 }}>
						<Typography variant="body2" sx={{ mb: 1 }}>Upload .xlsx with headers: name, number, earliest_at, latest_at (optional).</Typography>
						<Stack spacing={2}>
							<div>
								<Typography variant="caption">Assistant</Typography>
								<Select fullWidth displayEmpty value={assistantId} onChange={e => setAssistantId(e.target.value as string)}>
									<MenuItem value=""><em>Select assistant</em></MenuItem>
									{agents.map((a: any) => <MenuItem key={a.id} value={a.id}>{a.name || a.id}</MenuItem>)}
								</Select>
								{agentsLoading && <Typography color="text.secondary">Loading assistants…</Typography>}
							</div>
							<input type="file" ref={fileRef} accept=".xlsx" />
							<Button variant="outlined" onClick={onUpload}>Upload & Schedule</Button>
						</Stack>
					</Paper>
				</Box>
			</Stack>
		</Stack>
	)
}

