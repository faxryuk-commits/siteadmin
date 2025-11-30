import { useState } from 'react'
import { useContent } from '@/contexts/ContentContext'
import { Plus, Edit2, Trash2, ExternalLink, Globe } from 'lucide-react'
import { toast } from 'sonner'
import type { PageStructure } from '@/contexts/ContentContext'

export function Dashboard() {
  const { pages, currentPage, setCurrentPage, addPage, deletePage } = useContent()
  const [showAddPage, setShowAddPage] = useState(false)
  const [newPageName, setNewPageName] = useState('')
  const [newPagePath, setNewPagePath] = useState('')

  const handleAddPage = () => {
    if (!newPageName || !newPagePath) {
      toast.error('Заполните все поля')
      return
    }

    const page: PageStructure = {
      id: `page-${Date.now()}`,
      path: newPagePath,
      name: newPageName,
      sections: [],
    }

    addPage(page)
    setShowAddPage(false)
    setNewPageName('')
    setNewPagePath('')
    toast.success('Страница добавлена')
  }

  const handleDeletePage = (pageId: string) => {
    if (confirm('Удалить эту страницу?')) {
      deletePage(pageId)
      toast.success('Страница удалена')
    }
  }

  const handleEditPage = (page: PageStructure) => {
    setCurrentPage(page)
    window.location.href = '/editor'
  }

  const handleViewPage = (page: PageStructure) => {
    window.open(`https://delever.io${page.path}`, '_blank')
  }

  const defaultPages: PageStructure[] = [
    {
      id: 'home',
      path: '/',
      name: 'Главная',
      sections: [
        {
          id: 'hero-title',
          type: 'heading',
          path: 'home.hero.title',
          value: 'Единая платформа для управления доставкой',
          label: 'Заголовок Hero',
        },
        {
          id: 'hero-description',
          type: 'paragraph',
          path: 'home.hero.description',
          value: 'Управляйте всеми каналами продаж, операциями доставки и аналитикой из одного места.',
          label: 'Описание Hero',
        },
      ],
    },
  ]

  const allPages = [...defaultPages, ...pages]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-darkBlue mb-2">
          Управление страницами
        </h1>
        <p className="text-brand-darkBlue/60">
          Создавайте и редактируйте страницы сайта
        </p>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-brand-darkBlue">Страницы</h2>
        <button
          onClick={() => setShowAddPage(true)}
          className="px-4 py-2 bg-gradient-dark text-white rounded-lg font-medium hover:opacity-90 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Добавить страницу
        </button>
      </div>

      {showAddPage && (
        <div className="mb-6 p-6 bg-white rounded-xl border border-gray-200 shadow-soft">
          <h3 className="text-lg font-semibold text-brand-darkBlue mb-4">
            Новая страница
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-brand-darkBlue mb-2">
                Название страницы
              </label>
              <input
                type="text"
                value={newPageName}
                onChange={(e) => setNewPageName(e.target.value)}
                placeholder="О компании"
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-darkBlue focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-darkBlue mb-2">
                Путь (URL)
              </label>
              <input
                type="text"
                value={newPagePath}
                onChange={(e) => setNewPagePath(e.target.value)}
                placeholder="/about"
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-darkBlue focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddPage}
              className="px-6 py-2 bg-gradient-dark text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Создать
            </button>
            <button
              onClick={() => {
                setShowAddPage(false)
                setNewPageName('')
                setNewPagePath('')
              }}
              className="px-6 py-2 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allPages.map((page) => (
          <div
            key={page.id}
            className="bg-white rounded-xl p-6 border border-gray-200 shadow-soft hover:shadow-medium transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-brand-darkBlue mb-1">
                  {page.name}
                </h3>
                <p className="text-sm text-brand-darkBlue/60 flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  {page.path}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-brand-darkBlue/70">
                Элементов: {page.sections.length}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleEditPage(page)}
                className="flex-1 px-4 py-2 bg-gradient-dark text-white rounded-lg text-sm font-medium hover:opacity-90 flex items-center justify-center gap-2"
              >
                <Edit2 className="h-4 w-4" />
                Редактировать
              </button>
              <button
                onClick={() => handleViewPage(page)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center justify-center transition-colors"
                title="Открыть на сайте"
              >
                <ExternalLink className="h-4 w-4" />
              </button>
              {!defaultPages.find((p) => p.id === page.id) && (
                <button
                  onClick={() => handleDeletePage(page.id)}
                  className="px-4 py-2 text-red-500 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

