import { useAuth } from '@/contexts/AuthContext'
import { User, Bell } from 'lucide-react'

export function Header() {
  const { user } = useAuth()

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-brand-darkBlue">
          Панель управления
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 rounded-lg hover:bg-gray-100 text-brand-darkBlue/70 hover:text-brand-darkBlue transition-colors">
          <Bell className="h-5 w-5" />
        </button>
        
        <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-brand-lightBlue/50">
          <div className="h-8 w-8 rounded-full bg-brand-darkBlue flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-brand-darkBlue">
              {user?.email || 'Администратор'}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}

