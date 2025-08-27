import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useRef, useState } from 'react'
import { Box, Button, FormControl, FormLabel, Heading, HStack, Input, Select, Text, Textarea, VStack, useToast } from '@chakra-ui/react'

export default function SchedulePage() {
	const toast = useToast()
	const { data: agents = [], isLoading: agentsLoading } = useQuery<any[]>({ queryKey: ['agents'], queryFn: api.listAgents as any })
	const [assistantId, setAssistantId] = useState('')
	const [name, setName] = useState('')
	const [number, setNumber] = useState('')
	const [earliest, setEarliest] = useState('')
	const [latest, setLatest] = useState('')
	const [context, setContext] = useState('')
	const fileRef = useRef<HTMLInputElement>(null)

	const onScheduleSingle = async () => {
		if (!assistantId || !number || !earliest) { toast({ title: 'Assistant, number and earliest time are required', status: 'warning' }); return }
		await api.scheduleSingle({ assistant_id: assistantId, name: name || undefined, number, earliest_at: earliest, latest_at: latest || undefined, context: context || undefined } as any)
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
							<FormLabel>Assistant</FormLabel>
							<Select placeholder="Select assistant" value={assistantId} onChange={e => setAssistantId(e.target.value)}>
								{agents.map((a: any) => <option key={a.id} value={a.id}>{a.name || a.id}</option>)}
							</Select>
							{agentsLoading && <Text opacity={0.7}>Loading assistants…</Text>}
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
						<FormControl>
							<FormLabel>Call Context (optional)</FormLabel>
							<Textarea value={context} onChange={e => setContext(e.target.value)} placeholder="Why are we calling? Key details for the agent." rows={4} />
						</FormControl>
						<Button colorScheme="blue" onClick={onScheduleSingle}>Schedule</Button>
					</VStack>
				</Box>
				<Box flex="1">
					<Heading size="sm" mb={3}>Bulk Upload</Heading>
					<Text mb={2}>Upload .xlsx with headers: name, number, earliest_at, latest_at (optional).</Text>
					<VStack align="stretch" spacing={3}>
						<FormControl>
							<FormLabel>Assistant</FormLabel>
							<Select placeholder="Select assistant" value={assistantId} onChange={e => setAssistantId(e.target.value)}>
								{agents.map((a: any) => <option key={a.id} value={a.id}>{a.name || a.id}</option>)}
							</Select>
							{agentsLoading && <Text opacity={0.7}>Loading assistants…</Text>}
						</FormControl>
						<Input type="file" ref={fileRef} accept=".xlsx" />
						<Button onClick={onUpload}>Upload & Schedule</Button>
					</VStack>
				</Box>
			</HStack>
		</VStack>
	)
}

