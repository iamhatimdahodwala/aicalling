import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useEffect, useMemo, useState } from 'react'
import { Box, Button, Heading, HStack, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Select, Table, Tbody, Td, Th, Thead, Tr, Textarea, useDisclosure, useToast } from '@chakra-ui/react'

export default function AgentsPage() {
	const toast = useToast()
	const { data = [], refetch, isLoading } = useQuery<any[]>({ queryKey: ['agents'], queryFn: api.listAgents as any })
	const [selected, setSelected] = useState<any | null>(null)
	const [prompt, setPrompt] = useState('')
	const [kb, setKb] = useState('')
	const [docs, setDocs] = useState<any[]>([])
	const { isOpen, onOpen, onClose } = useDisclosure()

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
					try { const d: any = await (api.listKbDocs as any)(akb.knowledgeBaseId); setDocs((d && (d.documents || d)) || []); } catch {}
				} else {
					setKb('')
					setDocs([])
				}
			} catch (e) {
				// ignore, toast on explicit errors
			}
		}
		if (isOpen) load()
	}, [isOpen, selected])

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
		onSuccess: async () => { toast({ title: 'Knowledge base updated', status: 'success' }); await refetch(); if (kb) { try { const d: any = await (api.listKbDocs as any)(kb); setDocs((d && (d.documents || d)) || []); } catch {} } },
		onError: () => toast({ title: 'Failed to update KB', status: 'error' })
	})

	const onUpload = async (f?: File) => {
		if (!selected || !kb || !f) return
		await (api.uploadKbDoc as any)(kb, f)
		toast({ title: 'Document uploaded', status: 'success' })
		try { const d: any = await (api.listKbDocs as any)(kb); setDocs((d && (d.documents || d)) || []); } catch {}
	}

	const onDelete = async (docId: string) => {
		if (!kb) return
		await (api.deleteKbDoc as any)(kb, docId)
		toast({ title: 'Document deleted', status: 'success' })
		try { const d: any = await (api.listKbDocs as any)(kb); setDocs((d && (d.documents || d)) || []); } catch {}
	}

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
									<Button size="xs" onClick={() => { setSelected(a); onOpen(); }}>Edit</Button>
								</Td>
							</Tr>
						))}
					</Tbody>
				</Table>
			)}

			<Modal isOpen={isOpen} onClose={onClose} size="xl">
				<ModalOverlay />
				<ModalContent bg="gray.800" color="white">
					<ModalHeader bg="whiteAlpha.200" borderBottom="1px" borderColor="whiteAlpha.300">Edit Agent</ModalHeader>
					<ModalBody>
						<HStack mb={3}>
							<Box flex="1">
								<Heading size="xs" mb={1}>Knowledge Base</Heading>
								<HStack>
									<Select placeholder="Select KB" value={kb} onChange={e => setKb(e.target.value)}>
										{kbList.map((k: any) => <option key={k.id} value={k.id}>{k.name || k.id}</option>)}
									</Select>
									<Button size="sm" onClick={() => saveKb.mutate()} isLoading={saveKb.isPending}>Attach</Button>
								</HStack>
							</Box>
						</HStack>
						<Heading size="xs" mb={1}>System Prompt</Heading>
						<Textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={8} placeholder="Current system prompt" />

						{kb && (
							<Box mt={4}>
								<Heading size="xs" mb={2}>Documents</Heading>
								<HStack mb={2}>
									<Input type="file" onChange={e => onUpload(e.target.files?.[0] || undefined)} />
								</HStack>
								<Table size="sm" variant="simple">
									<Thead><Tr><Th>Name</Th><Th w="1%"></Th></Tr></Thead>
									<Tbody>
										{(docs || []).map((d: any) => (
											<Tr key={d.id || d.documentId}>
												<Td>{d.name || d.filename || d.id || d.documentId}</Td>
												<Td><Button size="xs" colorScheme="red" onClick={() => onDelete(d.id || d.documentId)}>Delete</Button></Td>
											</Tr>
										))}
									</Tbody>
								</Table>
							</Box>
						)}
					</ModalBody>
					<ModalFooter bg="whiteAlpha.200" borderTop="1px" borderColor="whiteAlpha.300">
						<Button mr={3} onClick={onClose} variant="ghost">Close</Button>
						<Button colorScheme="blue" onClick={() => savePrompt.mutate()} isLoading={savePrompt.isPending}>Save</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</Box>
	)
}

