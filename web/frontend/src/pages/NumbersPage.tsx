import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Box, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography, Button } from '@mui/material'
import { useState } from 'react'

export default function NumbersPage() {
	const qc = useQueryClient()
	const { data: numbers = [] } = useQuery<any[]>({ queryKey: ['numbers'], queryFn: api.listNumbers as any })
	const { data: agents = [] } = useQuery<any[]>({ queryKey: ['agents'], queryFn: api.listAgents as any })
	const [pending, setPending] = useState<Record<string, string|undefined>>({})

	const save = useMutation({
		mutationFn: async ({ id, assistantId }: { id: string, assistantId?: string }) => (api.updateNumberAssistant as any)(id, assistantId),
		onSuccess: async () => { await qc.invalidateQueries({ queryKey: ['numbers'] }) },
	})

	return (
		<Box>
			<Typography variant="h6" sx={{ mb: 2 }}>Numbers</Typography>
			<Paper variant="outlined">
				<Table size="small">
					<TableHead>
						<TableRow>
							<TableCell>Phone Number</TableCell>
							<TableCell>Assistant</TableCell>
							<TableCell width="1%"></TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{(numbers as any[]).map((n: any) => (
							<TableRow key={n.id}>
								<TableCell>{n.phoneNumber || n.id}</TableCell>
								<TableCell>
									<Select size="small" value={pending[n.id] ?? (n.assistantId || '')} displayEmpty onChange={e => setPending(p => ({ ...p, [n.id]: (e.target.value as string) || undefined }))}>
										<MenuItem value=""><em>Unassigned</em></MenuItem>
										{(agents as any[]).map((a: any) => <MenuItem key={a.id} value={a.id}>{a.name || a.id}</MenuItem>)}
									</Select>
								</TableCell>
								<TableCell>
									<Button size="small" variant="contained" onClick={() => save.mutate({ id: n.id, assistantId: pending[n.id] })} disabled={save.isPending}>Save</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</Paper>
		</Box>
	)
}