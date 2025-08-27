import { Badge } from '@chakra-ui/react'

export default function StatusBadge({ status }: { status?: string }) {
	const s = (status || '').toLowerCase()
	const color = s === 'active' ? 'green' : s === 'queued' ? 'orange' : s === 'completed' ? 'blue' : 'gray'
	return <Badge colorScheme={color}>{status || 'unknown'}</Badge>
}

