import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useContent, ContentItem } from '@/contexts/ContentContext'
import { 
  Trash2, 
  Eye, 
  EyeOff, 
  Save, 
  X,
  Type,
  Square,
  MousePointerClick,
  Image as ImageIcon
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface VisualEditorProps {
  iframeUrl: string
}

export function VisualEditor({ iframeUrl }: VisualEditorProps) {
  const { currentPage, updateContentItem, addContentItem, deleteContentItem, syncToSite } = useContent()
  const navigate = useNavigate()
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null)
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null)
  const [editValue, setEditValue] = useState('')
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const handleItemClick = (item: ContentItem) => {
    if (!isPreviewMode) {
      setSelectedItem(item)
      setEditingItem(item)
      setEditValue(item.value)
    }
  }

  const handleSave = () => {
    if (editingItem && currentPage) {
      updateContentItem(currentPage.id, editingItem.id, { value: editValue })
      toast.success('Изменения сохранены')
      setEditingItem(null)
    }
  }

  const handleAddElement = (type: ContentItem['type']) => {
    if (!currentPage) return

    const newItem: ContentItem = {
      id: `item-${Date.now()}`,
      type,
      path: `${currentPage.path}.${type}-${Date.now()}`,
      value: type === 'heading' ? 'Новый заголовок' : type === 'paragraph' ? 'Новый текст' : '',
      label: type === 'heading' ? 'Заголовок' : type === 'paragraph' ? 'Текст' : 'Элемент',
    }

    addContentItem(currentPage.id, newItem)
    toast.success('Элемент добавлен')
  }

  const handleDelete = () => {
    if (selectedItem && currentPage) {
      deleteContentItem(currentPage.id, selectedItem.id)
      setSelectedItem(null)
      setEditingItem(null)
      toast.success('Элемент удален')
    }
  }

  // TODO: Реализовать drag and drop функциональность

  const handleSync = async () => {
    await syncToSite()
    toast.success('Изменения синхронизированы с сайтом')
  }

  if (!currentPage) {
    return (
      <div className="flex items-center justify-center h-full min-h-[calc(100vh-4rem)]">
        <div className="text-center p-8">
          <h3 className="text-xl font-semibold text-brand-darkBlue mb-2">
            Страница не выбрана
          </h3>
          <p className="text-brand-darkBlue/60 mb-4">
            Выберите страницу для редактирования на дашборде
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-gradient-dark text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Перейти к дашборду
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Левая панель - Элементы */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <div className="p-4 border-b border-gray-200 bg-brand-lightBlue/30">
          <h3 className="font-semibold text-brand-darkBlue mb-3">Добавить элемент</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleAddElement('heading')}
              className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 flex flex-col items-center gap-1"
            >
              <Type className="h-5 w-5 text-brand-darkBlue" />
              <span className="text-xs text-brand-darkBlue/70">Заголовок</span>
            </button>
            <button
              onClick={() => handleAddElement('paragraph')}
              className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 flex flex-col items-center gap-1"
            >
              <Square className="h-5 w-5 text-brand-darkBlue" />
              <span className="text-xs text-brand-darkBlue/70">Текст</span>
            </button>
            <button
              onClick={() => handleAddElement('image')}
              className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 flex flex-col items-center gap-1"
            >
              <ImageIcon className="h-5 w-5 text-brand-darkBlue" />
              <span className="text-xs text-brand-darkBlue/70">Изображение</span>
            </button>
            <button
              onClick={() => handleAddElement('button')}
              className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 flex flex-col items-center gap-1"
            >
              <MousePointerClick className="h-5 w-5 text-brand-darkBlue" />
              <span className="text-xs text-brand-darkBlue/70">Кнопка</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
          <h4 className="text-sm font-medium text-brand-darkBlue mb-3">Структура страницы</h4>
          {currentPage.sections.length === 0 ? (
            <div className="text-center py-8 text-brand-darkBlue/50 text-sm">
              <p>Нет элементов</p>
              <p className="text-xs mt-1">Добавьте элементы выше</p>
            </div>
          ) : (
          <div className="space-y-1">
            {currentPage.sections.map((section) => (
              <div
                key={section.id}
                onClick={() => handleItemClick(section)}
                className={cn(
                  'p-2 rounded cursor-pointer text-sm',
                  selectedItem?.id === section.id
                    ? 'bg-brand-lightBlue text-brand-darkBlue'
                    : 'hover:bg-gray-50 text-brand-darkBlue/70'
                )}
              >
                <div className="flex items-center justify-between">
                  <span>{section.label}</span>
                  <span className="text-xs text-brand-darkBlue/40 capitalize">
                    {section.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      </div>

      {/* Центральная область - Предпросмотр */}
      <div className="flex-1 flex flex-col bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                isPreviewMode 
                  ? "bg-gray-100 text-brand-darkBlue/70" 
                  : "bg-brand-lightBlue text-brand-darkBlue"
              )}
            >
              {isPreviewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {isPreviewMode ? 'Просмотр' : 'Редактирование'}
            </button>
            <div className="text-sm text-brand-darkBlue/60">
              <span className="font-medium">{currentPage.name}</span>
              <span className="mx-2">•</span>
              <span>{currentPage.path}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSync}
              className="px-4 py-2 bg-gradient-dark text-white rounded-lg text-sm font-medium hover:opacity-90 flex items-center gap-2 transition-opacity"
            >
              <Save className="h-4 w-4" />
              Синхронизировать
            </button>
          </div>
        </div>

        <div className="flex-1 relative bg-gray-100">
          <iframe
            ref={iframeRef}
            src={iframeUrl}
            className="w-full h-full border-0"
            title="Preview"
          />
          
          {!isPreviewMode && selectedItem && (
            <div className="absolute top-4 right-4 bg-white rounded-xl shadow-large border border-gray-200 p-5 w-96 z-10">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                <div>
                  <h4 className="font-semibold text-brand-darkBlue">Редактирование</h4>
                  <p className="text-xs text-brand-darkBlue/50 mt-1">{selectedItem.label}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedItem(null)
                    setEditingItem(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-brand-darkBlue mb-2">
                    {selectedItem.label}
                  </label>
                  {selectedItem.type === 'paragraph' || selectedItem.type === 'heading' ? (
                    <textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-darkBlue"
                      rows={4}
                    />
                  ) : (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-darkBlue"
                    />
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="flex-1 px-4 py-2 bg-gradient-dark text-white rounded-lg text-sm font-medium hover:opacity-90"
                  >
                    Сохранить
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

