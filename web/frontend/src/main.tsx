import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ChakraProvider, extendTheme } from '@chakra-ui/react'

const queryClient = new QueryClient()
const theme = extendTheme({
	styles: { global: { body: { bg: '#0b1220', color: 'white' } } },
	fonts: {
		heading: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto',
		body: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto',
	},
	radii: { md: '10px', lg: '14px' },
	components: {
		Modal: {
			baseStyle: {
				dialog: { bg: 'gray.800', color: 'white' },
			},
		},
		Input: { defaultProps: { variant: 'filled' } },
		Select: { defaultProps: { variant: 'filled' } },
		Textarea: { defaultProps: { variant: 'filled' } },
		Button: { baseStyle: { borderRadius: '10px' } },
	},
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ChakraProvider theme={theme}>
        <App />
      </ChakraProvider>
    </QueryClientProvider>
  </StrictMode>,
)
