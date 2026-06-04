import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AnimatePresence } from 'framer-motion'
import { AuthProvider } from '@/contexts/AuthContext'
import { ToastProvider } from '@/components/shared/Toast'
import AppRouter from '@/router'
import { useEffect } from 'react'
import { useThemeStore } from '@/store/themeStore'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,       // 5 min
      gcTime: 10 * 60 * 1000,         // 10 min
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

function ThemeInitializer() {
  const { theme } = useThemeStore()
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])
  return null
}

export default function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>
            <BrowserRouter>
              <ThemeInitializer />
              <AnimatePresence mode="wait">
                <AppRouter />
              </AnimatePresence>
            </BrowserRouter>
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  )
}
