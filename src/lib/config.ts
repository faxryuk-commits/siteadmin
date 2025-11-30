// Конфигурация приложения
export const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://delever-site-plh9d7t0b-fakhriddins-projects-e76e6079.vercel.app'
export const API_URL = import.meta.env.VITE_API_URL || 'https://api.delever.io'

// Токен для доступа к сайту из админки
// Должен быть задан через переменную окружения VITE_ADMIN_EDIT_TOKEN
export const ADMIN_EDIT_TOKEN = import.meta.env.VITE_ADMIN_EDIT_TOKEN || 
  (typeof window !== 'undefined' 
    ? localStorage.getItem('admin-edit-token') || generateSecureToken()
    : 'dev-token-fallback')

// Секрет для обхода Vercel Deployment Protection
// Должен совпадать с секретом в "Protection Bypass for Automation" на сайте
export const PROTECTION_BYPASS_SECRET = import.meta.env.VITE_PROTECTION_BYPASS_SECRET || ''

// Генерация безопасного токена
function generateSecureToken(): string {
  // Генерируем токен из случайных символов
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(x => chars[x % chars.length])
    .join('')
  
  // Сохраняем в localStorage для постоянства
  if (typeof window !== 'undefined') {
    localStorage.setItem('admin-edit-token', token)
  }
  
  return token
}

