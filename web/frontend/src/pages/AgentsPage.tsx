import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useMemo, useState } from 'react'
import { Box, Button, Heading, HStack, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Table, Tbody, Td, Th, Thead, Tr, Textarea, useDisclosure, useToast } from '@chakra-ui/react'

export default function AgentsPage() {
	const toast = useToast()
	const { data = [], refetch, isLoading } = useQuery<any[]>({ queryKey: ['agents'], queryFn: api.listAgents as any })
	const [selected, setSelected] = useState<any | null>(null)
	const [prompt, setPrompt] = useState('')
	const [kb, setKb] = useState('')
	const { isOpen, onOpen, onClose } = useDisclosure()

	const rows = useMemo(() => data, [data])

	const savePrompt = useMutation({
		mutationFn: async () => {
			if (!selected) return
			await api.updateSystemPrompt(selected.id, prompt)
		},
		onSuccess: async () => { toast({ title: 'Prompt saved', status: 'success' }); await refetch(); onClose(); },
		onError: () => toast({ title: 'Failed to save prompt', status: 'error' })
	})
	const saveKb = useMutation({
		mutationFn: async () => {
			if (!selected) return
			await api.updateKnowledgeBase(selected.id, kb || undefined)
		},
		onSuccess: async () => { toast({ title: 'Knowledge base updated', status: 'success' }); await refetch(); },
		onError: () => toast({ title: 'Failed to update KB', status: 'error' })
	})

	return (
		<Box>
			<Heading size="md" mb={4}>Agents</Heading>
			{isLoading ? 'Loading…' : (
				<Table variant="simple" size="sm">
					<Thead><Tr><Th>Name</Th><Th>Id</Th><Th w="1%"></Th></Tr></Thead>
					<Tbody>
						{rows.map((a: any) => (
							<Tr key={a.id} _hover={{ bg: 'whiteAlpha.100' }}>
								<Td>{a.name || 'Untitled'}</Td>
								<Td>{a.id}</Td>
								<Td>
									<Button size="xs" onClick={() => { setSelected(a); setPrompt(''); setKb(''); onOpen(); }}>Edit</Button>
								</Td>
							</Tr>
						))}
					</Tbody>
				</Table>
			)}

			<Modal isOpen={isOpen} onClose={onClose} size="lg">
				<ModalOverlay />
				<ModalContent>
					<ModalHeader>Edit Agent</ModalHeader>
					<ModalBody>
						<HStack mb={3}>
							<Box flex="1">
								<Heading size="xs" mb={1}>Knowledge Base Id</Heading>
								<HStack>
									<Input value={kb} onChange={e => setKb(e.target.value)} placeholder="kb_xxx" />
									<Button size="sm" onClick={() => saveKb.mutate()} isLoading={saveKb.isPending}>Attach</Button>
								</HStack>
							</Box>
						</HStack>
						<Heading size="xs" mb={1}>System Prompt</Heading>
						<Textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={10} placeholder="Type new system prompt" />
					</ModalBody>
					<ModalFooter>
						<Button mr={3} onClick={onClose} variant="ghost">Close</Button>
						<Button colorScheme="blue" onClick={() => savePrompt.mutate()} isLoading={savePrompt.isPending}>Save</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</Box>
	)
}

