import { Chip } from '@mui/material'

export default function StatusBadge({ status }: { status?: string }) {
	const s = (status || '').toLowerCase()
	const color: 'default' | 'primary' | 'success' | 'warning' | 'info' | 'error' =
		s === 'active' ? 'success' : s === 'queued' ? 'warning' : s === 'completed' ? 'info' : 'default'
	return <Chip size="small" color={color} label={status || 'unknown'} />
}

