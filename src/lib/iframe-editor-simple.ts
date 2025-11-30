// Упрощенная версия редактора iframe - без сложной инжекции скрипта
// Использует только postMessage для коммуникации

export interface EditableElement {
  id: string
  type: string
  selector: string
  content: string
  html: string
  label: string
}

export interface IframeMessage {
  type: 'ELEMENTS_LOADED' | 'ELEMENT_SELECTED' | 'ELEMENT_UPDATED' | 'READY'
  payload?: any
}

// Простой скрипт для инжекции в iframe
export const SIMPLE_EDITOR_SCRIPT = `
(function() {
  if (window.__DELEVER_SIMPLE_EDITOR_INITIALIZED__) return;
  window.__DELEVER_SIMPLE_EDITOR_INITIALIZED__ = true;

  console.log('✅ Simple editor script loaded');

  let editableElements = [];

  // Функция для получения селектора элемента
  function getSelector(element) {
    if (element.id) return '#' + element.id;
    
    let path = [];
    let current = element;
    let depth = 0;
    
    while (current && current.nodeType === 1 && depth < 5) {
      let selector = current.tagName.toLowerCase();
      if (current.className) {
        const classes = Array.from(current.classList)
          .filter(c => !c.includes('delever'))
          .slice(0, 3)
          .join('.');
        if (classes) selector += '.' + classes;
      }
      path.unshift(selector);
      current = current.parentElement;
      depth++;
    }
    
    return path.join(' > ');
  }

  // Функция для определения типа элемента
  function getType(element) {
    const tag = element.tagName.toLowerCase();
    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) return 'heading';
    if (tag === 'p') return 'paragraph';
    if (tag === 'img') return 'image';
    if (tag === 'button') return 'button';
    if (tag === 'a') return 'link';
    return 'text';
  }

  // Функция для получения контента
  function getContent(element) {
    if (element.tagName === 'IMG') {
      return element.src || element.alt || '';
    }
    return element.textContent?.trim() || element.innerText?.trim() || '';
  }

  // Сканирование элементов
  function scanElements() {
    const elements = [];
    const processed = new Set();

    function processElement(el, depth = 0) {
      if (depth > 4 || processed.has(el)) return;
      processed.add(el);

      if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'META', 'LINK'].includes(el.tagName)) return;

      const content = getContent(el);
      const type = getType(el);
      
      if (content || ['section', 'div', 'article', 'header', 'footer', 'main'].includes(el.tagName.toLowerCase())) {
        const selector = getSelector(el);
        const id = 'elem-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        
        elements.push({
          id,
          type,
          selector,
          content: content.substring(0, 200),
          html: el.outerHTML.substring(0, 200),
          label: content.substring(0, 50) || el.tagName.toLowerCase()
        });

        // Обрабатываем дочерние элементы
        if (el.children && elements.length < 200) {
          Array.from(el.children).forEach(child => {
            if (child instanceof HTMLElement) {
              processElement(child, depth + 1);
            }
          });
        }
      }
    }

    if (document.body) {
      processElement(document.body);
    }

    return elements;
  }

  // Отправка элементов родителю
  function sendElements() {
    try {
      const elements = scanElements();
      editableElements = elements;
      
      console.log('📤 Sending', elements.length, 'elements to parent');
      
      window.parent.postMessage({
        type: 'ELEMENTS_LOADED',
        payload: { elements }
      }, '*');
    } catch (error) {
      console.error('❌ Error sending elements:', error);
    }
  }

  // Обработчик клика
  document.addEventListener('click', function(e) {
    const target = e.target;
    if (!target || target === document.body) return;

    e.preventDefault();
    e.stopPropagation();

    const selector = getSelector(target);
    const type = getType(target);
    const content = getContent(target);

    // Выделение
    document.querySelectorAll('.delever-highlight').forEach(el => {
      el.classList.remove('delever-highlight');
    });
    target.classList.add('delever-highlight');

    // Отправка сообщения
    window.parent.postMessage({
      type: 'ELEMENT_SELECTED',
      payload: {
        id: 'elem-' + Date.now(),
        type,
        selector,
        content,
        label: content.substring(0, 50) || target.tagName.toLowerCase()
      }
    }, '*');
  }, true);

  // Стили
  const style = document.createElement('style');
  style.textContent = \`
    .delever-highlight {
      outline: 3px solid #3b82f6 !important;
      outline-offset: 2px !important;
      background-color: rgba(59, 130, 246, 0.15) !important;
    }
    * {
      cursor: pointer !important;
    }
  \`;
  document.head.appendChild(style);

  // Обработчик сообщений от родителя
  window.addEventListener('message', function(event) {
    if (event.data.type === 'UPDATE_ELEMENT') {
      const { selector, content } = event.data.payload;
      try {
        const element = document.querySelector(selector);
        if (element) {
          if (element.tagName === 'IMG') {
            element.src = content;
          } else {
            element.textContent = content;
          }
          
          window.parent.postMessage({
            type: 'ELEMENT_UPDATED',
            payload: { selector, success: true }
          }, '*');
        }
      } catch (error) {
        window.parent.postMessage({
          type: 'ELEMENT_UPDATED',
          payload: { selector, success: false }
        }, '*');
      }
    }
  });

  // Отправка элементов при загрузке
  function trySendElements() {
    console.log('🔄 Attempting to send elements, readyState:', document.readyState);
    sendElements();
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('✅ DOM ready, sending elements in 500ms');
    setTimeout(trySendElements, 500);
  } else {
    console.log('⏳ DOM not ready, waiting for events');
    window.addEventListener('load', () => {
      console.log('✅ Load event fired, sending elements in 500ms');
      setTimeout(trySendElements, 500);
    });
    document.addEventListener('DOMContentLoaded', () => {
      console.log('✅ DOMContentLoaded fired, sending elements in 500ms');
      setTimeout(trySendElements, 500);
    });
  }

  // Дополнительные попытки
  setTimeout(() => {
    console.log('🔄 Retry 1: sending elements after 2 seconds');
    trySendElements();
  }, 2000);

  setTimeout(() => {
    console.log('🔄 Retry 2: sending elements after 5 seconds');
    trySendElements();
  }, 5000);

  // Уведомление о готовности
  console.log('📤 Sending READY message to parent');
  window.parent.postMessage({ type: 'READY' }, '*');

  // Обработчик запроса элементов от родителя
  window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'REQUEST_ELEMENTS') {
      console.log('📥 Received REQUEST_ELEMENTS, sending elements immediately');
      trySendElements();
    }
  });
})();
`

// Упрощенная функция инжекции
export function injectSimpleEditorScript(iframe: HTMLIFrameElement): Promise<void> {
  return new Promise((resolve) => {
    const tryInject = () => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) {
          console.warn('⚠️ Cannot access iframe document (CORS) - script will be injected via postMessage');
          // Пытаемся отправить скрипт через postMessage
          iframe.contentWindow?.postMessage({
            type: 'INJECT_SCRIPT',
            script: SIMPLE_EDITOR_SCRIPT
          }, '*');
          resolve();
          return;
        }

        // Проверяем, не инжектирован ли уже
        if ((iframe.contentWindow as any)?.__DELEVER_SIMPLE_EDITOR_INITIALIZED__) {
          console.log('✅ Script already initialized');
          resolve();
          return;
        }

        console.log('📝 Injecting simple editor script...');
        const script = iframeDoc.createElement('script');
        script.textContent = SIMPLE_EDITOR_SCRIPT;
        iframeDoc.head.appendChild(script);
        
        console.log('✅ Script injected');
        resolve();
      } catch (error) {
        console.error('❌ Injection error:', error);
        resolve(); // Разрешаем, чтобы не блокировать процесс
      }
    };

    if (iframe.contentDocument?.readyState === 'complete') {
      setTimeout(tryInject, 100);
    } else {
      iframe.onload = () => setTimeout(tryInject, 100);
    }
  });
}

