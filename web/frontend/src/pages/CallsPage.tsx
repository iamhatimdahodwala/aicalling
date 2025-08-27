import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useMemo, useState } from 'react'
import { Box, CircularProgress, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'

export default function CallsPage() {
	const { data = [], isLoading } = useQuery<any[]>({ queryKey: ['calls'], queryFn: api.listCalls as any })
	const [selected, setSelected] = useState<any | null>(null)
	const filtered = useMemo(() => data || [], [data])

	return (
		<Stack direction="row" spacing={3} alignItems="flex-start">
			<Box flex={1}>
				<Typography variant="h6" sx={{ mb: 1 }}>Calls</Typography>
				<Box sx={{ position: 'relative' }}>
					{isLoading && (
						<Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 1 }}>
							<CircularProgress size={28} />
						</Box>
					)}
					<Paper variant="outlined">
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell>Caller</TableCell>
									<TableCell>Status</TableCell>
									<TableCell>Duration</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{filtered.map((c: any) => (
									<TableRow key={c.id} hover sx={{ cursor: 'pointer' }} onClick={() => setSelected(c)}>
										<TableCell>{c.customer?.name || c.customer?.number || c.id}</TableCell>
										<TableCell>{c.status}</TableCell>
										<TableCell>{c.endedAt && c.startedAt ? `${Math.round((new Date(c.endedAt).getTime() - new Date(c.startedAt).getTime()) / 1000)}s` : '-'}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</Paper>
				</Box>
			</Box>
			<Box flex={1}>
				{selected ? <CallDetail call={selected} /> : <Typography color="text.secondary">Select a call</Typography>}
			</Box>
		</Stack>
	)
}

function CallDetail({ call }: { call: any }) {
	const { data = {} as any, isLoading } = useQuery<any>({ queryKey: ['artifacts', call.id], queryFn: () => api.getArtifacts(call.id) as any })
	return (
		<Paper variant="outlined" sx={{ p: 2 }}>
			<Typography variant="subtitle1">Call Detail</Typography>
			<Typography variant="body2"><b>Id:</b> {call.id}</Typography>
			<Typography variant="body2"><b>Status:</b> {call.status}</Typography>
			{isLoading && (
				<Stack direction="row" alignItems="center" spacing={1}>
					<CircularProgress size={16} />
					<Typography variant="body2">Loading artifacts…</Typography>
				</Stack>
			)}
			{data?.transcript && (
				<Box sx={{ mt: 1 }}>
					<Typography variant="caption" sx={{ opacity: 0.8 }}>Transcript</Typography>
					<Box component="pre" sx={{ whiteSpace: 'pre-wrap', maxHeight: 260, overflowY: 'auto', mt: 0.5 }}>{data.transcript}</Box>
				</Box>
			)}
			{data?.recordingUrl && (
				<Box sx={{ mt: 1 }}>
					<Typography variant="caption" sx={{ opacity: 0.8 }}>Recording</Typography>
					<audio controls src={data.recordingUrl} />
				</Box>
			)}
		</Paper>
	)
}

