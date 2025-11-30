import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Lock, Mail } from 'lucide-react'
import { toast } from 'sonner'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const success = login(email, password)
      if (success) {
        toast.success('Успешный вход в систему')
        navigate('/')
      } else {
        toast.error('Неверный email или пароль')
      }
    } catch (error) {
      toast.error('Ошибка при входе')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-lightBlue via-white to-brand-lightBeige px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-large p-8 border border-gray-200">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-lightBlue mb-4">
              <Lock className="h-8 w-8 text-brand-darkBlue" />
            </div>
            <h1 className="text-3xl font-bold text-brand-darkBlue mb-2">
              Delever Admin
            </h1>
            <p className="text-brand-darkBlue/60">
              Визуальный редактор контента
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-darkBlue mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-brand-darkBlue/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@delever.io"
                  className="w-full pl-10 pr-4 py-2 border border-brand-lightTeal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-darkBlue focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-darkBlue mb-2">
                Пароль
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-brand-darkBlue/40" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Введите пароль"
                  className="w-full pl-10 pr-4 py-2 border border-brand-lightTeal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-darkBlue focus:border-transparent"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-dark text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-brand-lightBlue/30 rounded-lg">
            <p className="text-xs text-brand-darkBlue/60 text-center">
              Тестовые данные: admin@delever.io / admin123
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

