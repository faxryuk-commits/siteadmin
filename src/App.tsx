import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ContentProvider, useContent } from './contexts/ContentContext'
import { Toaster } from 'sonner'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { VisualEditor } from './components/VisualEditor'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { SITE_URL } from './lib/config'

function EditorPage() {
  const { currentPage } = useContent()
  // Используем текущую страницу или дефолтный путь
  // Убираем ?edit=true, так как это может вызывать 401 ошибку
  const pagePath = currentPage?.path || '/'
  const iframeUrl = `${SITE_URL}${pagePath}`

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

