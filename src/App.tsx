import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ContentProvider, useContent } from './contexts/ContentContext'
import { Toaster } from 'sonner'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { VisualEditor } from './components/VisualEditor'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { SITE_URL, ADMIN_EDIT_TOKEN, PROTECTION_BYPASS_SECRET } from './lib/config'

function EditorPage() {
  const { currentPage } = useContent()
  // Используем текущую страницу или дефолтный путь
  const pagePath = currentPage?.path || '/'
  
  // Строим URL с токеном и секретом для обхода защиты
  const params = new URLSearchParams({
    admin_token: ADMIN_EDIT_TOKEN,
    edit_mode: 'true',
  })
  
  // Добавляем секрет для обхода Vercel Deployment Protection
  if (PROTECTION_BYPASS_SECRET) {
    params.set('x-vercel-protection-bypass', PROTECTION_BYPASS_SECRET)
  }
  
  const iframeUrl = `${SITE_URL}${pagePath}?${params.toString()}`

  return <VisualEditor iframeUrl={iframeUrl} />
}

function App() {
  return (
    <AuthProvider>
      <ContentProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/editor"
              element={
                <ProtectedRoute>
                  <Layout>
                    <EditorPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster position="top-right" />
        </BrowserRouter>
      </ContentProvider>
    </AuthProvider>
  )
}

export default App

