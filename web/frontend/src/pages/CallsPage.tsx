import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useMemo, useState } from 'react'
import { Box, Heading, HStack, Spinner, Table, Tbody, Td, Th, Thead, Tr, Text, VStack } from '@chakra-ui/react'

export default function CallsPage() {
	const { data = [], isLoading } = useQuery<any[]>({ queryKey: ['calls'], queryFn: api.listCalls as any })
	const [selected, setSelected] = useState<any | null>(null)
	const filtered = useMemo(() => data || [], [data])

	return (
		<HStack align="start" spacing={6}>
			<Box flex="1">
				<Heading size="md" mb={3}>Calls</Heading>
				<Box position="relative">
					{isLoading && (
						<Box position="absolute" inset={0} display="flex" alignItems="center" justifyContent="center" bg="blackAlpha.300" borderRadius="md">
							<Spinner />
						</Box>
					)}
					<Table variant="simple" size="sm">
						<Thead>
							<Tr><Th>Caller</Th><Th>Status</Th><Th>Duration</Th></Tr>
						</Thead>
						<Tbody>
							{filtered.map((c: any) => (
								<Tr key={c.id} _hover={{ bg: 'whiteAlpha.100' }} cursor="pointer" onClick={() => setSelected(c)}>
									<Td>{c.customer?.name || c.customer?.number || c.id}</Td>
									<Td>{c.status}</Td>
									<Td>{c.endedAt && c.startedAt ? `${Math.round((new Date(c.endedAt).getTime() - new Date(c.startedAt).getTime()) / 1000)}s` : '-'}</Td>
								</Tr>
							))}
						</Tbody>
					</Table>
				</Box>
			</Box>
			<Box flex="1">
				{selected ? <CallDetail call={selected} /> : <Box opacity={0.7}>Select a call</Box>}
			</Box>
		</HStack>
	)
}

function CallDetail({ call }: { call: any }) {
	const { data = {} as any, isLoading } = useQuery<any>({ queryKey: ['artifacts', call.id], queryFn: () => api.getArtifacts(call.id) as any })
	return (
		<VStack align="stretch" spacing={3} border="1px" borderColor="whiteAlpha.300" borderRadius="md" p={4}>
			<Heading size="sm">Call Detail</Heading>
			<Text><b>Id:</b> {call.id}</Text>
			<Text><b>Status:</b> {call.status}</Text>
			{isLoading && <HStack><Spinner size="sm" /><Text>Loading artifacts…</Text></HStack>}
			{data?.transcript && (
				<Box>
					<Heading size="xs" mb={1}>Transcript</Heading>
					<Box as="pre" whiteSpace="pre-wrap" maxH="260px" overflowY="auto">{data.transcript}</Box>
				</Box>
			)}
			{data?.recordingUrl && (
				<Box>
					<Heading size="xs" mb={1}>Recording</Heading>
					<audio controls src={data.recordingUrl} />
				</Box>
			)}
		</VStack>
	)
}

