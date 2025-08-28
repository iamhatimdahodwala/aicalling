import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useEffect, useMemo, useState } from 'react'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material'

export default function AgentsPage() {
	const { data = [], refetch, isLoading } = useQuery<any[]>({ queryKey: ['agents'], queryFn: api.listAgents as any })
	const [selected, setSelected] = useState<any | null>(null)
	const [prompt, setPrompt] = useState('')
	const [kb, setKb] = useState('')
	const [kbName, setKbName] = useState('')
	const [docs, setDocs] = useState<any[]>([])
	const [open, setOpen] = useState(false)

	const { data: kbList = [] } = useQuery<any[]>({ queryKey: ['kb-list'], queryFn: api.listKb as any })

	useEffect(() => {
		const load = async () => {
			if (!selected) return
			try {
				const sp: any = await (api.getSystemPrompt as any)(selected.id)
				setPrompt((sp && sp.prompt) || '')
				const akb: any = await (api.getAssistantKb as any)(selected.id)
				if (akb && akb.knowledgeBaseId) {
					setKb(akb.knowledgeBaseId as string)
					setKbName((akb.knowledgeBaseName as string) || '')
					try { const d: any = await (api.listKbDocs as any)(akb.knowledgeBaseId); setDocs((d && (d.documents || d)) || []); } catch {}
				} else {
					setKb('')
					setKbName('')
					setDocs([])
				}
			} catch {}
		}
		if (open) load()
	}, [open, selected])

	const rows = useMemo(() => data, [data])

	const savePrompt = useMutation({
		mutationFn: async () => { if (!selected) return; await api.updateSystemPrompt(selected.id, prompt) },
		onSuccess: async () => { await refetch(); setOpen(false) },
	})
	const saveKb = useMutation({
		mutationFn: async () => { if (!selected) return; await api.updateKnowledgeBase(selected.id, kb || undefined) },
		onSuccess: async () => { await refetch(); if (kb) { try { const d: any = await (api.listKbDocs as any)(kb); setDocs((d && (d.documents || d)) || []); } catch {} } },
	})
	const detachKb = useMutation({
		mutationFn: async () => { if (!selected) return; await api.updateKnowledgeBase(selected.id, undefined) },
		onSuccess: async () => { setKb(''); setKbName(''); setDocs([]); await refetch() },
	})

	const onUpload = async (f?: File) => {
		if (!selected || !kb || !f) return
		await (api.uploadKbDoc as any)(kb, f)
		try { const d: any = await (api.listKbDocs as any)(kb); setDocs((d && (d.documents || d)) || []); } catch {}
	}

	const onDelete = async (docId: string) => {
		if (!kb) return
		await (api.deleteKbDoc as any)(kb, docId)
		try { const d: any = await (api.listKbDocs as any)(kb); setDocs((d && (d.documents || d)) || []); } catch {}
	}

	return (
		<Box sx={{ width: '100%' }}>
			<Typography variant="h6" sx={{ mb: 2 }}>Agents</Typography>
			{isLoading ? 'Loading…' : (
				<Paper variant="outlined" sx={{ width: '100%' }}>
					<Table size="small" sx={{ width: '100%' }}>
						<TableHead><TableRow><TableCell>Name</TableCell><TableCell>Id</TableCell><TableCell width="1%"></TableCell></TableRow></TableHead>
						<TableBody>
							{rows.map((a: any) => (
								<TableRow key={a.id} hover>
									<TableCell>{a.name || 'Untitled'}</TableCell>
									<TableCell>{a.id}</TableCell>
									<TableCell>
										<Button size="small" variant="outlined" onClick={() => { setSelected(a); setOpen(true) }}>Edit</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</Paper>
			)}

			<Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
				<DialogTitle>Edit Agent</DialogTitle>
				<DialogContent>
					<Stack spacing={2} sx={{ mt: 1 }}>
						<Typography variant="caption">Knowledge Base</Typography>
						<Stack direction="row" spacing={1} alignItems="center">
							<Select fullWidth displayEmpty value={kb} onChange={e => setKb(e.target.value as string)}>
								<MenuItem value=""><em>Select KB</em></MenuItem>
								{kbList.map((k: any) => <MenuItem key={k.id} value={k.id}>{k.name || k.id}</MenuItem>)}
							</Select>
							<Button size="small" variant="contained" onClick={() => saveKb.mutate()}>Attach</Button>
							{kbName && <Button size="small" color="error" onClick={() => detachKb.mutate()}>Detach current ({kbName})</Button>}
						</Stack>
						<Typography variant="caption">System Prompt</Typography>
						<TextField multiline minRows={6} value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Current system prompt" fullWidth />

						{kb && (
							<Box>
								<Typography variant="caption">Documents</Typography>
								<Stack direction="row" spacing={1} sx={{ my: 1 }}>
									<input type="file" onChange={e => onUpload(e.target.files?.[0] || undefined)} />
								</Stack>
								<Paper variant="outlined">
									<Table size="small">
										<TableHead><TableRow><TableCell>Name</TableCell><TableCell width="1%"></TableCell></TableRow></TableHead>
										<TableBody>
											{(docs || []).map((d: any) => (
												<TableRow key={d.id || d.documentId}>
													<TableCell>{d.name || d.filename || d.id || d.documentId}</TableCell>
													<TableCell><Button size="small" color="error" onClick={() => onDelete(d.id || d.documentId)}>Delete</Button></TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</Paper>
							</Box>
						)}
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setOpen(false)}>Close</Button>
					<Button variant="contained" onClick={() => savePrompt.mutate()}>Save</Button>
				</DialogActions>
			</Dialog>
		</Box>
	)
}

