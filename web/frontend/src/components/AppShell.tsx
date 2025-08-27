import { Link, useLocation } from 'react-router-dom'
import { AppBar, Box, CssBaseline, Drawer, List, ListItemButton, ListItemText, Toolbar, Typography } from '@mui/material'

const drawerWidth = 260

const NavItem = ({ to, children }: { to: string, children: any }) => {
	const loc = useLocation()
	const active = loc.pathname.startsWith(to)
	return (
		<ListItemButton component={Link} to={to} selected={active} sx={{ borderRadius: 1 }}>
			<ListItemText primaryTypographyProps={{ fontWeight: active ? 600 : 500 }}>{children}</ListItemText>
		</ListItemButton>
	)
}

export default function AppShell({ children }: { children: any }) {
	return (
		<Box sx={{ display: 'flex' }}>
			<CssBaseline />
			<AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1, bgcolor: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(6px)' }}>
				<Toolbar>
					<Typography variant="h6" noWrap component="div">AI Call Management</Typography>
				</Toolbar>
			</AppBar>
			<Drawer variant="permanent" sx={{ width: drawerWidth, flexShrink: 0, [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', bgcolor: 'rgba(255,255,255,0.04)' } }}>
				<Toolbar />
				<Box sx={{ overflow: 'auto', pt: 1 }}>
					<List>
						<NavItem to="/call-management">Call Management</NavItem>
						<NavItem to="/agents">Agents</NavItem>
						<NavItem to="/calls">Calls</NavItem>
						<NavItem to="/schedule">Schedule</NavItem>
					</List>
				</Box>
			</Drawer>
			<Box component="main" sx={{ flexGrow: 1, p: 2, width: `calc(100% - ${drawerWidth}px)` }}>
				<Toolbar />
				{children}
			</Box>
		</Box>
	)
}

