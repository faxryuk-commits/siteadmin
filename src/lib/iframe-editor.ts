// Утилиты для взаимодействия с iframe редактора

export interface EditableElement {
  id: string
  type: 'text' | 'heading' | 'paragraph' | 'image' | 'button' | 'link' | 'section' | 'div' | 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'a' | 'img' | 'button'
  selector: string
  content: string
  html: string
  attributes: Record<string, string>
  path: string
  label: string
  parent?: string
  children?: EditableElement[]
}

export interface IframeMessage {
  type: 'ELEMENT_SELECTED' | 'ELEMENTS_LOADED' | 'ELEMENT_UPDATED' | 'INIT_EDITOR' | 'HIGHLIGHT_ELEMENT' | 'UPDATE_ELEMENT'
  payload?: any
}

// Скрипт для инжекции в iframe
export const EDITOR_SCRIPT = `
(function() {
  if (window.__DELEVER_EDITOR_INITIALIZED__) return;
  window.__DELEVER_EDITOR_INITIALIZED__ = true;

  // Режим редактирования всегда активен при загрузке из админки
  // Параметр ?edit=true не обязателен, так как может вызывать проблемы с авторизацией
  const EDITOR_MODE = true;

  let selectedElement = null;
  let editableElements = [];

  // Функция для получения уникального селектора элемента
  function getElementSelector(element) {
    if (element.id) return '#' + element.id;
    
    let path = [];
    while (element && element.nodeType === Node.ELEMENT_NODE) {
      let selector = element.nodeName.toLowerCase();
      if (element.className) {
        const classes = Array.from(element.classList).filter(c => !c.includes('delever-editor')).join('.');
        if (classes) selector += '.' + classes;
      }
      path.unshift(selector);
      element = element.parentElement;
      if (path.length > 5) break; // Ограничиваем глубину
    }
    return path.join(' > ');
  }

  // Функция для определения типа элемента
  function getElementType(element) {
    const tagName = element.tagName.toLowerCase();
    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) return 'heading';
    if (tagName === 'p') return 'paragraph';
    if (tagName === 'img') return 'image';
    if (tagName === 'button' || element.closest('button')) return 'button';
    if (tagName === 'a') return 'link';
    if (element.textContent && element.textContent.trim().length > 0) return 'text';
    return 'section';
  }

  // Функция для извлечения текстового содержимого
  function getElementContent(element) {
    if (element.tagName === 'IMG') {
      return element.getAttribute('src') || element.getAttribute('alt') || '';
    }
    return element.textContent?.trim() || element.innerText?.trim() || '';
  }

  // Функция для получения всех редактируемых элементов
  function scanEditableElements() {
    const elements = [];
    const processed = new Set();

    function processElement(element, parentId) {
      if (processed.has(element)) return;
      processed.add(element);

      // Пропускаем скрипты, стили и служебные элементы
      if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'META', 'LINK'].includes(element.tagName)) return;
      if (element.classList.contains('delever-editor-overlay')) return;

      const type = getElementType(element);
      const content = getElementContent(element);
      
      // Добавляем только элементы с контентом или важные структурные элементы
      if (content || ['section', 'div', 'article', 'header', 'footer', 'main', 'nav'].includes(element.tagName.toLowerCase())) {
        const id = 'elem-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        const selector = getElementSelector(element);
        
        const editableElement = {
          id,
          type,
          selector,
          content,
          html: element.outerHTML.substring(0, 200), // Первые 200 символов для предпросмотра
          attributes: Array.from(element.attributes).reduce((acc, attr) => {
            acc[attr.name] = attr.value;
            return acc;
          }, {}),
          path: selector,
          label: content.substring(0, 50) || element.tagName.toLowerCase(),
          parent: parentId,
        };

        elements.push(editableElement);

        // Обрабатываем дочерние элементы (но не слишком глубоко)
        if (element.children.length > 0 && elements.length < 500) {
          Array.from(element.children).forEach((child) => {
            if (child instanceof HTMLElement) {
              processElement(child, id);
            }
          });
        }
      }
    }

    // Начинаем сканирование с body
    if (document.body) {
      processElement(document.body);
    }

    return elements;
  }

  // Функция для выделения элемента
  function highlightElement(element) {
    // Удаляем предыдущие выделения
    document.querySelectorAll('.delever-editor-highlight').forEach(el => {
      el.classList.remove('delever-editor-highlight');
    });

    element.classList.add('delever-editor-highlight');
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Функция для обновления элемента
  function updateElement(selector, content) {
    try {
      const element = document.querySelector(selector);
      if (!element) return false;

      if (element.tagName === 'IMG') {
        element.setAttribute('src', content);
        element.setAttribute('alt', content);
      } else {
        element.textContent = content;
      }

      return true;
    } catch (error) {
      console.error('Error updating element:', error);
      return false;
    }
  }

  // Обработчик клика на элемент
  document.addEventListener('click', function(e) {
    if (!EDITOR_MODE) return;
    
    const target = e.target;
    if (!target) return;

    // Пропускаем служебные элементы
    if (target.classList.contains('delever-editor-overlay')) return;

    e.preventDefault();
    e.stopPropagation();

    selectedElement = target;
    highlightElement(target);

    const selector = getElementSelector(target);
    const type = getElementType(target);
    const content = getElementContent(target);

    // Отправляем сообщение родительскому окну
    window.parent.postMessage({
      type: 'ELEMENT_SELECTED',
      payload: {
        id: 'elem-' + Date.now(),
        type,
        selector,
        content,
        html: target.outerHTML.substring(0, 200),
        attributes: Array.from(target.attributes).reduce((acc, attr) => {
          acc[attr.name] = attr.value;
          return acc;
        }, {}),
        path: selector,
        label: content.substring(0, 50) || target.tagName.toLowerCase(),
      }
    }, '*');
  }, true);

  // Стили для выделения
  const style = document.createElement('style');
  style.textContent = \`
    .delever-editor-highlight {
      outline: 2px solid #3b82f6 !important;
      outline-offset: 2px !important;
      background-color: rgba(59, 130, 246, 0.1) !important;
      cursor: pointer !important;
    }
    .delever-editor-highlight:hover {
      background-color: rgba(59, 130, 246, 0.2) !important;
    }
    * {
      cursor: pointer !important;
    }
  \`;
  document.head.appendChild(style);

  // Загружаем элементы при загрузке страницы
  function sendElements() {
    try {
      console.log('🔍 Scanning for editable elements...');
      const elements = scanEditableElements();
      editableElements = elements;
      
      console.log('📤 Sending', elements.length, 'elements to parent');
      console.log('Elements:', elements.slice(0, 5).map(e => ({ type: e.type, label: e.label }))); // Логируем первые 5 для отладки
      
      const message = {
        type: 'ELEMENTS_LOADED',
        payload: { elements }
      };
      
      window.parent.postMessage(message, '*');
      console.log('✅ Message sent to parent');
    } catch (error) {
      console.error('❌ Error sending elements:', error);
    }
  }

  // Пытаемся отправить элементы сразу, если DOM готов
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('📄 DOM ready, sending elements in 500ms...');
    setTimeout(sendElements, 500);
  } else {
    console.log('⏳ Waiting for load event...');
    window.addEventListener('load', function() {
      console.log('✅ Load event fired, sending elements in 500ms...');
      setTimeout(sendElements, 500);
    });
  }
  
  // Также пытаемся отправить через DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      console.log('✅ DOMContentLoaded fired, sending elements in 500ms...');
      setTimeout(sendElements, 500);
    });
  }
  
  // Дополнительная попытка через 2 секунды (на случай, если предыдущие не сработали)
  setTimeout(function() {
    if (editableElements.length === 0) {
      console.log('🔄 Retry: sending elements after 2 seconds...');
      sendElements();
    }
  }, 2000);

  // Обработчик сообщений от родительского окна
  window.addEventListener('message', function(event) {
    if (event.data.type === 'HIGHLIGHT_ELEMENT') {
      const selector = event.data.payload.selector;
      const element = document.querySelector(selector);
      if (element) {
        highlightElement(element);
      }
    } else if (event.data.type === 'UPDATE_ELEMENT') {
      const { selector, content } = event.data.payload;
      const success = updateElement(selector, content);
      window.parent.postMessage({
        type: 'ELEMENT_UPDATED',
        payload: { selector, success }
      }, '*');
    }
  });

  // Экспортируем функции для отладки
  window.__deleverEditor = {
    scanElements: scanEditableElements,
    highlightElement,
    updateElement,
  };
})();
`

// Функция для инжекции скрипта в iframe
export function injectEditorScript(iframe: HTMLIFrameElement) {
  return new Promise<void>((resolve, reject) => {
    const doInject = () => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) {
          console.error('❌ Cannot access iframe document - possible CORS or X-Frame-Options issue');
          reject(new Error('Cannot access iframe document'));
          return;
        }

        // Проверяем, не инжектирован ли уже скрипт
        if ((iframe.contentWindow as any)?.__DELEVER_EDITOR_INITIALIZED__) {
          console.log('✅ Script already initialized');
          resolve();
          return;
        }

        console.log('📝 Injecting editor script into iframe...');
        
        // Создаем и добавляем скрипт
        const script = iframeDoc.createElement('script');
        script.textContent = EDITOR_SCRIPT;
        script.onerror = (error) => {
          console.error('❌ Script injection error:', error);
          reject(error);
        };
        iframeDoc.head.appendChild(script);

        // Проверяем, что скрипт выполнился
        setTimeout(() => {
          if ((iframe.contentWindow as any)?.__DELEVER_EDITOR_INITIALIZED__) {
            console.log('✅ Script injected and initialized successfully');
            resolve();
          } else {
            console.warn('⚠️ Script injected but not initialized - may need more time');
            resolve(); // Разрешаем, так как скрипт может инициализироваться позже
          }
        }, 100);
      } catch (error) {
        console.error('❌ Error injecting script:', error);
        reject(error);
      }
    };

    if (iframe.contentDocument?.readyState === 'complete') {
      doInject();
    } else {
      iframe.onload = () => {
        setTimeout(doInject, 100); // Небольшая задержка для полной загрузки
      };
    }
  });
}

