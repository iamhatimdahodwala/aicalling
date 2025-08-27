import { Box, Flex, HStack, Heading, Link as CLink, Spacer, Text, VStack } from '@chakra-ui/react'
import { Link, useLocation } from 'react-router-dom'

const NavLink = ({ to, children }: { to: string, children: any }) => {
	const loc = useLocation()
	const active = loc.pathname.startsWith(to)
	return (
		<CLink as={Link} to={to} px={3} py={2} borderRadius="md" bg={active ? 'whiteAlpha.200' : 'transparent'} _hover={{ bg: 'whiteAlpha.200' }}>
			{children}
		</CLink>
	)
}

export default function AppShell({ children }: { children: any }) {
	return (
		<Flex minH="100vh">
			<VStack as="aside" w="260px" bg="rgba(255,255,255,0.04)" borderRight="1px" borderColor="whiteAlpha.300" p={4} spacing={4} align="stretch">
				<Heading size="md">Vapi Admin</Heading>
				<VStack align="stretch" spacing={1}>
					<NavLink to="/call-management">Call Management</NavLink>
					<NavLink to="/agents">Agents</NavLink>
					<NavLink to="/calls">Calls</NavLink>
					<NavLink to="/schedule">Schedule</NavLink>
				</VStack>
				<Spacer />
				<Text opacity={0.6} fontSize="sm">© {new Date().getFullYear()}</Text>
			</VStack>
			<Box flex="1">
				<HStack as="header" h="56px" px={6} borderBottom="1px" borderColor="whiteAlpha.300" bg="rgba(255,255,255,0.04)" backdropFilter="blur(4px)">
					<Heading size="sm">AI Call Management</Heading>
				</HStack>
				<Box as="main" p={6}>
					{children}
				</Box>
			</Box>
		</Flex>
	)
}

