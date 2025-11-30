import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface AuthContextType {
  isAuthenticated: boolean
  login: (email: string, password: string) => boolean
  logout: () => void
  user: { email: string } | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const AUTH_KEY = 'delever-admin-auth'
const DEFAULT_EMAIL = 'admin@delever.io'
const DEFAULT_PASSWORD = 'admin123'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(AUTH_KEY)
        return stored === 'true'
      }
    } catch (e) {
      console.error('Error reading auth from localStorage:', e)
    }
    return false
  })

  const [user, setUser] = useState<{ email: string } | null>(() => {
    if (isAuthenticated) {
      return { email: DEFAULT_EMAIL }
    }
    return null
  })

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(AUTH_KEY, String(isAuthenticated))
      }
    } catch (e) {
      console.error('Error saving auth to localStorage:', e)
    }
  }, [isAuthenticated])

  const login = (email: string, password: string): boolean => {
    if (email === DEFAULT_EMAIL && password === DEFAULT_PASSWORD) {
      setIsAuthenticated(true)
      setUser({ email })
      return true
    }
    return false
  }

  const logout = () => {
    setIsAuthenticated(false)
    setUser(null)
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(AUTH_KEY)
      }
    } catch (e) {
      console.error('Error removing auth from localStorage:', e)
    }
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

