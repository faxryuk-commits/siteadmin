import { useState, useRef, useEffect } from 'react'
import { useContent } from '@/contexts/ContentContext'
import { Eye, EyeOff, Save, X, RefreshCw, Download } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { injectSimpleEditorScript, EditableElement, IframeMessage } from '@/lib/iframe-editor-simple'
import { SITE_URL } from '@/lib/config'

interface VisualEditorSimpleProps {
  iframeUrl: string
}

export function VisualEditorSimple({ iframeUrl }: VisualEditorSimpleProps) {
  const { syncToSite: syncToSiteContext } = useContent()
  const [selectedElement, setSelectedElement] = useState<EditableElement | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [editableElements, setEditableElements] = useState<EditableElement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Обработка сообщений от iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent<IframeMessage>) => {
      // Логируем ВСЕ сообщения для отладки
      console.log('📨 Received message from', event.origin, ':', event.data)
      
      // Разрешаем все vercel домены и localhost
      const allowedOrigins = ['vercel.app', 'localhost', '127.0.0.1']
      if (!allowedOrigins.some(origin => event.origin.includes(origin))) {
        console.log('⚠️ Message from unauthorized origin, ignoring:', event.origin)
        return
      }

      // Проверяем структуру сообщения
      if (!event.data || !event.data.type) {
        console.warn('⚠️ Invalid message format:', event.data)
        return
      }

      console.log('✅ Processing message type:', event.data.type)

      const { type, payload } = event.data

      switch (type) {
        case 'READY':
          console.log('✅ Editor ready, requesting elements...');
          // Запрашиваем элементы сразу после готовности
          if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage({
              type: 'REQUEST_ELEMENTS'
            }, '*');
          }
          break

        case 'ELEMENTS_LOADED':
          if (payload?.elements) {
            console.log('✅ Elements loaded:', payload.elements.length);
            setEditableElements(payload.elements)
            setIsLoading(false)
            toast.success(`Загружено ${payload.elements.length} элементов`)
          }
          break

        case 'ELEMENT_SELECTED':
          if (payload && !isPreviewMode) {
            console.log('✅ Element selected:', payload.selector);
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
    return () => window.removeEventListener('message', handleMessage)
  }, [isPreviewMode])

  // Инжекция скрипта при загрузке iframe
  useEffect(() => {
    if (!iframeRef.current) {
      console.warn('⚠️ iframeRef.current is null')
      return
    }

    const iframe = iframeRef.current
    console.log('🔄 Setting up iframe injection for:', iframeUrl)

    const handleLoad = async () => {
      console.log('🔄 Iframe onload event fired')
      
      // Ждем немного для полной загрузки DOM
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log('📝 Starting script injection...')
      try {
        await injectSimpleEditorScript(iframe)
        console.log('✅ Script injection promise resolved')
        
        // Дополнительная проверка через 2 секунды
        setTimeout(() => {
          console.log('🔍 Checking if elements were loaded...')
          if (editableElements.length === 0) {
            console.warn('⚠️ No elements loaded after 2 seconds, trying to request manually...')
            // Пытаемся запросить элементы вручную
            iframe.contentWindow?.postMessage({
              type: 'REQUEST_ELEMENTS'
            }, '*')
          }
        }, 2000)
      } catch (error) {
        console.error('❌ Script injection failed:', error)
        toast.error('Ошибка загрузки редактора. Проверьте консоль.')
      }
    }

    // Проверяем готовность iframe
    try {
      if (iframe.contentDocument?.readyState === 'complete') {
        console.log('✅ Iframe already complete, injecting immediately')
        handleLoad()
      } else {
        console.log('⏳ Iframe not ready, waiting for onload event')
        iframe.onload = handleLoad
      }
    } catch (e) {
      // CORS блокирует доступ - это нормально
      console.log('⚠️ Cannot check iframe readyState (CORS), using onload event')
      iframe.onload = handleLoad
    }
  }, [iframeUrl, editableElements.length])

  // Обновление элемента
  const handleUpdateElement = () => {
    if (!selectedElement || !iframeRef.current) return

    const iframe = iframeRef.current.contentWindow
    if (!iframe) return

    iframe.postMessage({
      type: 'UPDATE_ELEMENT',
      payload: {
        selector: selectedElement.selector,
        content: editingValue,
      }
    }, '*')

    setEditableElements(prev =>
      prev.map(el =>
        el.id === selectedElement.id
          ? { ...el, content: editingValue }
          : el
      )
    )

    toast.success('Изменения применены')
  }

  // Выбор элемента из списка
  const handleElementSelect = (element: EditableElement) => {
    if (isPreviewMode) return

    setSelectedElement(element)
    setEditingValue(element.content || '')

    const iframe = iframeRef.current?.contentWindow
    if (iframe) {
      iframe.postMessage({
        type: 'HIGHLIGHT_ELEMENT',
        payload: { selector: element.selector }
      }, '*')
    }
  }

  // Перезагрузка элементов
  const handleReloadElements = () => {
    setIsLoading(true)
    setEditableElements([])
    setSelectedElement(null)
    setEditingValue('')
    
    if (iframeRef.current) {
      injectSimpleEditorScript(iframeRef.current).then(() => {
        setIsLoading(false)
      })
    }
  }

  // Синхронизация
  const handleSync = async () => {
    try {
      const changes = editableElements.map(el => ({
        selector: el.selector,
        content: el.content,
        type: el.type,
      }))

      localStorage.setItem('delever-editor-changes', JSON.stringify(changes))
      
      const { saveElementChanges } = await import('@/lib/api')
      await saveElementChanges(changes)
      
      await syncToSiteContext()
      
      toast.success('Изменения синхронизированы с сайтом')
    } catch (error) {
      toast.error('Ошибка синхронизации')
      console.error(error)
    }
  }

  const pagePath = new URL(iframeUrl).pathname

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Левая панель */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <div className="p-4 border-b border-gray-200 bg-brand-lightBlue/30">
          <h3 className="font-semibold text-brand-darkBlue mb-3">Элементы страницы</h3>
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={handleReloadElements}
              className="px-4 py-2 bg-gradient-dark text-white rounded-lg text-sm font-medium hover:opacity-90 flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Обновить
            </button>
            <a
              href={`${SITE_URL}${pagePath}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Открыть
            </a>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="text-center py-8 text-brand-darkBlue/50 text-sm">
              <p>Загрузка элементов...</p>
            </div>
          ) : editableElements.length === 0 ? (
            <div className="text-center py-8 text-brand-darkBlue/50 text-sm">
              <p>Нет редактируемых элементов</p>
            </div>
          ) : (
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
                    <div className="font-medium truncate">{element.label}</div>
                    <div className="text-xs text-brand-darkBlue/50 mt-0.5 truncate">
                      {element.selector}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Центральная область */}
      <div className="flex-1 flex flex-col bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2",
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
          <button
            onClick={handleSync}
            className="px-4 py-2 bg-gradient-dark text-white rounded-lg text-sm font-medium hover:opacity-90 flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Синхронизировать
          </button>
        </div>

        <div className="flex-1 relative bg-gray-100">
          <iframe
            ref={iframeRef}
            src={iframeUrl}
            className="w-full h-full border-0"
            title="Preview"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
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
                  className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-brand-darkBlue mb-2">
                    {selectedElement.label}
                  </label>
                  {selectedElement.type === 'image' ? (
                    <>
                      <input
                        type="text"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-darkBlue mb-2"
                      />
                      {editingValue && (
                        <img src={editingValue} alt="Preview" className="max-w-full h-auto rounded-lg" />
                      )}
                    </>
                  ) : (
                    <textarea
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-darkBlue"
                      rows={4}
                    />
                  )}
                </div>
                
                <button
                  onClick={handleUpdateElement}
                  className="w-full px-4 py-2 bg-gradient-dark text-white rounded-lg text-sm font-medium hover:opacity-90"
                >
                  Применить
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

