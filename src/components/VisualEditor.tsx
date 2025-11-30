import { useState, useRef, useEffect } from 'react'
import { useContent } from '@/contexts/ContentContext'
import { 
  Eye, 
  EyeOff, 
  Save, 
  X,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { injectEditorScript, EditableElement, IframeMessage } from '@/lib/iframe-editor'
import { SITE_URL } from '@/lib/config'

interface VisualEditorProps {
  iframeUrl: string
}

export function VisualEditor({ iframeUrl }: VisualEditorProps) {
  const { syncToSite: syncToSiteContext } = useContent()
  const [selectedElement, setSelectedElement] = useState<EditableElement | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [editableElements, setEditableElements] = useState<EditableElement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Инициализация редактора при загрузке iframe
  useEffect(() => {
    if (!iframeRef.current) return

    const iframe = iframeRef.current

    const handleMessage = (event: MessageEvent<IframeMessage>) => {
      // Проверяем источник сообщения (разрешаем все vercel домены)
      const allowedOrigins = ['vercel.app', 'localhost', '127.0.0.1']
      if (!allowedOrigins.some(origin => event.origin.includes(origin))) {
        console.log('Message from unauthorized origin:', event.origin, 'Expected:', allowedOrigins)
        return
      }
      
      // Логируем все сообщения для отладки
      console.log('✅ Received message from', event.origin, ':', event.data)
      
      // Проверяем структуру сообщения
      if (!event.data || !event.data.type) {
        console.warn('⚠️ Invalid message format:', event.data)
        return
      }

      const { type, payload } = event.data

      switch (type) {
        case 'ELEMENTS_LOADED':
          if (payload?.elements) {
            setEditableElements(payload.elements)
            setIsLoading(false)
            toast.success(`Загружено ${payload.elements.length} элементов`)
          }
          break

        case 'ELEMENT_SELECTED':
          if (payload && !isPreviewMode) {
            setSelectedElement(payload)
            setEditingValue(payload.content || '')
          }
          break

        case 'ELEMENT_UPDATED':
          if (payload?.success) {
            toast.success('Элемент обновлен')
          } else {
            toast.error('Ошибка обновления элемента')
          }
          break
      }
    }

    window.addEventListener('message', handleMessage)

    // Инжектируем скрипт редактора
    const injectScript = async () => {
      try {
        // Ждем немного, чтобы DOM точно загрузился
        await new Promise(resolve => setTimeout(resolve, 500))
        
        console.log('📝 Starting script injection...')
        await injectEditorScript(iframe)
        
        console.log('✅ Script injection completed')
        
        // Не устанавливаем isLoading в false сразу - ждем сообщения ELEMENTS_LOADED
        // setIsLoading(false)
      } catch (error) {
        console.error('❌ Error injecting script:', error)
        // Не показываем ошибку сразу - возможно скрипт все равно работает через postMessage
        // setIsLoading(false)
      }
    }

    // Ждем загрузки iframe перед инжекцией
    const handleIframeLoad = () => {
      console.log('✅ Iframe loaded, will inject script in 500ms...')
      setTimeout(injectScript, 500)
    }

    // Проверяем готовность iframe (безопасно, с обработкой CORS)
    try {
      if (iframe.contentDocument?.readyState === 'complete') {
        handleIframeLoad()
      } else {
        iframe.onload = handleIframeLoad
      }
    } catch (e) {
      // Если не можем проверить из-за CORS, просто ждем события onload
      console.warn('⚠️ Cannot check iframe readyState (CORS), waiting for onload event...')
      iframe.onload = handleIframeLoad
    }

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [iframeUrl, isPreviewMode])

  // Функция для обновления элемента в iframe
  const handleUpdateElement = () => {
    if (!selectedElement || !iframeRef.current) return

    const iframe = iframeRef.current.contentWindow
    if (!iframe) return

    // Отправляем команду на обновление элемента
    iframe.postMessage({
      type: 'UPDATE_ELEMENT',
      payload: {
        selector: selectedElement.selector,
        content: editingValue,
      }
    }, '*')

    // Обновляем локальное состояние
    setEditableElements(prev => 
      prev.map(el => 
        el.id === selectedElement.id 
          ? { ...el, content: editingValue }
          : el
      )
    )

    toast.success('Изменения применены')
  }

  // Функция для выделения элемента в списке
  const handleElementSelect = (element: EditableElement) => {
    if (isPreviewMode) return

    setSelectedElement(element)
    setEditingValue(element.content || '')

    // Выделяем элемент в iframe
    const iframe = iframeRef.current?.contentWindow
    if (iframe) {
      iframe.postMessage({
        type: 'HIGHLIGHT_ELEMENT',
        payload: { selector: element.selector }
      }, '*')
    }
  }

  // Функция для перезагрузки элементов
  const handleReloadElements = () => {
    setIsLoading(true)
    setEditableElements([])
    
    if (iframeRef.current) {
      const iframe = iframeRef.current
      injectEditorScript(iframe).then(() => {
        // Перезагружаем iframe для повторного сканирования
        iframe.src = iframe.src
      })
    }
  }

  // Функция для синхронизации с сайтом
  const handleSync = async () => {
    try {
      // Сохраняем все изменения в localStorage
      const changes = editableElements.map(el => ({
        selector: el.selector,
        content: el.content,
        type: el.type,
      }))

      localStorage.setItem('delever-editor-changes', JSON.stringify(changes))
      
      // Импортируем функцию сохранения
      const { saveElementChanges } = await import('@/lib/api')
      await saveElementChanges(changes)
      
      // Также синхронизируем через контекст
      await syncToSiteContext()
      
      toast.success('Изменения синхронизированы с сайтом')
    } catch (error) {
      toast.error('Ошибка синхронизации')
      console.error(error)
    }
  }

  // Определяем, есть ли выбранная страница
  const pagePath = iframeUrl.includes('?') 
    ? iframeUrl.split('?')[0].replace(SITE_URL, '') 
    : '/'

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Левая панель - Элементы */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <div className="p-4 border-b border-gray-200 bg-brand-lightBlue/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-brand-darkBlue">Элементы страницы</h3>
            <button
              onClick={handleReloadElements}
              className="p-1.5 rounded hover:bg-gray-100 text-brand-darkBlue/70 hover:text-brand-darkBlue transition-colors"
              title="Обновить список элементов"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
          {isLoading && (
            <div className="text-xs text-brand-darkBlue/50">
              Загрузка элементов...
            </div>
          )}
          {!isLoading && editableElements.length === 0 && (
            <div className="text-xs text-brand-darkBlue/50">
              Кликните на элементы на странице для редактирования
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
          {editableElements.length > 0 ? (
            <>
              <div className="text-xs text-brand-darkBlue/60 mb-2">
                Найдено: {editableElements.length} элементов
              </div>
              <div className="space-y-1">
                {editableElements.map((element) => (
                  <div
                    key={element.id}
                    onClick={() => handleElementSelect(element)}
                    className={cn(
                      'p-2 rounded cursor-pointer text-sm transition-colors',
                      selectedElement?.id === element.id
                        ? 'bg-brand-lightBlue text-brand-darkBlue font-medium'
                        : 'hover:bg-gray-50 text-brand-darkBlue/70'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{element.label}</div>
                        <div className="text-xs text-brand-darkBlue/50 mt-0.5 truncate">
                          {element.selector}
                        </div>
                      </div>
                      <span className="text-xs text-brand-darkBlue/40 capitalize px-1.5 py-0.5 bg-gray-100 rounded">
                        {element.type}
                      </span>
                    </div>
                    {element.content && (
                      <div className="text-xs text-brand-darkBlue/60 mt-1 truncate">
                        {element.content.substring(0, 60)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-brand-darkBlue/50 text-sm">
              <p>Элементы не загружены</p>
              <p className="text-xs mt-1">Кликните на элементы на странице</p>
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
              <span className="font-medium">{pagePath}</span>
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
            allow="same-origin"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation"
            onLoad={() => {
              // Iframe загружен - скрипт будет инжектирован автоматически через useEffect
              console.log('✅ Iframe loaded')
            }}
          />
          
          {!isPreviewMode && selectedElement && (
            <div className="absolute top-4 right-4 bg-white rounded-xl shadow-large border border-gray-200 p-5 w-96 z-10">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                <div>
                  <h4 className="font-semibold text-brand-darkBlue">Редактирование</h4>
                  <p className="text-xs text-brand-darkBlue/50 mt-1">{selectedElement.type}</p>
                  <p className="text-xs text-brand-darkBlue/40 mt-1 font-mono truncate">
                    {selectedElement.selector}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedElement(null)
                    setEditingValue('')
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-brand-darkBlue mb-2">
                    Содержимое
                  </label>
                  {selectedElement.type === 'image' ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        placeholder="URL изображения"
                        className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-darkBlue"
                      />
                      {editingValue && (
                        <img 
                          src={editingValue} 
                          alt="Preview" 
                          className="w-full h-32 object-cover rounded border border-gray-200"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      )}
                    </div>
                  ) : selectedElement.type === 'heading' || selectedElement.type === 'paragraph' || selectedElement.type === 'text' ? (
                    <textarea
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-darkBlue"
                      rows={6}
                      placeholder="Введите текст..."
                    />
                  ) : (
                    <input
                      type="text"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-darkBlue"
                      placeholder="Введите значение..."
                    />
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdateElement}
                    className="flex-1 px-4 py-2 bg-gradient-dark text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Применить
                  </button>
                </div>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin text-brand-darkBlue mx-auto mb-2" />
                <p className="text-brand-darkBlue/70">Загрузка элементов...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
