import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './lib/auth'
import { ToastProvider } from './components/ToastProvider'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep data fresh for 2 minutes, then refetch on window focus
      staleTime: 2 * 60 * 1000,
      // Retry failed requests once
      retry: 1,
      // Refetch when window regains focus (useful when switching back to the app)
      refetchOnWindowFocus: true,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
