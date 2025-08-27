import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useRef, useState } from 'react'
import { Box, Button, FormControl, FormLabel, Heading, HStack, Input, Text, VStack, useToast } from '@chakra-ui/react'

export default function SchedulePage() {
	const toast = useToast()
	const { data: template } = useQuery({ queryKey: ['template'], queryFn: api.getScheduleTemplate as any })
	const [assistantId, setAssistantId] = useState('')
	const [name, setName] = useState('')
	const [number, setNumber] = useState('')
	const [earliest, setEarliest] = useState('')
	const [latest, setLatest] = useState('')
	const fileRef = useRef<HTMLInputElement>(null)

	const onScheduleSingle = async () => {
		if (!assistantId || !number || !earliest) { toast({ title: 'Assistant, number and earliest time are required', status: 'warning' }); return }
		await api.scheduleSingle({ assistant_id: assistantId, name: name || undefined, number, earliest_at: earliest, latest_at: latest || undefined })
		toast({ title: 'Call scheduled', status: 'success' })
	}
	const onUpload = async () => {
		const f = fileRef.current?.files?.[0]
		if (!assistantId || !f) { toast({ title: 'Assistant and file required', status: 'warning' }); return }
		await api.scheduleUpload(assistantId, f)
		toast({ title: 'Bulk calls scheduled', status: 'success' })
	}

	return (
		<VStack align="stretch" spacing={6}>
			<Heading size="md">Schedule Calls</Heading>
			<HStack align="start" spacing={8}>
				<Box flex="1">
					<Heading size="sm" mb={3}>Single Call</Heading>
					<VStack align="stretch" spacing={3}>
						<FormControl>
							<FormLabel>Assistant Id</FormLabel>
							<Input value={assistantId} onChange={e => setAssistantId(e.target.value)} placeholder="assistant_xxx" />
						</FormControl>
						<FormControl>
							<FormLabel>Customer Name (optional)</FormLabel>
							<Input value={name} onChange={e => setName(e.target.value)} placeholder="John Smith" />
						</FormControl>
						<FormControl>
							<FormLabel>Customer Number</FormLabel>
							<Input value={number} onChange={e => setNumber(e.target.value)} placeholder="+14155551234" />
						</FormControl>
						<HStack>
							<FormControl>
								<FormLabel>Earliest At</FormLabel>
								<Input type="datetime-local" value={earliest} onChange={e => setEarliest(e.target.value)} />
							</FormControl>
							<FormControl>
								<FormLabel>Latest At (optional)</FormLabel>
								<Input type="datetime-local" value={latest} onChange={e => setLatest(e.target.value)} />
							</FormControl>
						</HStack>
						<Button colorScheme="blue" onClick={onScheduleSingle}>Schedule</Button>
					</VStack>
				</Box>
				<Box flex="1">
					<Heading size="sm" mb={3}>Bulk Upload</Heading>
					<Text mb={2}>Upload .xlsx with headers: name, number, earliest_at, latest_at (optional).</Text>
					<VStack align="stretch" spacing={3}>
						<FormControl>
							<FormLabel>Assistant Id</FormLabel>
							<Input value={assistantId} onChange={e => setAssistantId(e.target.value)} placeholder="assistant_xxx" />
						</FormControl>
						<Input type="file" ref={fileRef} accept=".xlsx" />
						<Button onClick={onUpload}>Upload & Schedule</Button>
						{template && <Box as="pre" whiteSpace="pre-wrap" opacity={0.6}>{JSON.stringify(template, null, 2)}</Box>}
					</VStack>
				</Box>
			</HStack>
		</VStack>
	)
}

