// Прокси для обхода X-Frame-Options и CORS ограничений

// Альтернативный способ: используем прокси через наш API
export function getProxiedUrl(url: string): string {
  // Если есть API_URL, используем прокси
  const API_URL = import.meta.env.VITE_API_URL
  if (API_URL) {
    return `${API_URL}/proxy?url=${encodeURIComponent(url)}`
  }
  
  // Иначе возвращаем оригинальный URL
  return url
}

// Функция для загрузки HTML через прокси
export async function fetchPageContent(url: string): Promise<string> {
  try {
    const API_URL = import.meta.env.VITE_API_URL
    if (API_URL) {
      const response = await fetch(`${API_URL}/proxy?url=${encodeURIComponent(url)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'text/html',
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch page')
      }
      
      return await response.text()
    }
    
    // Fallback: прямая загрузка (может не работать из-за CORS)
    const response = await fetch(url, {
      mode: 'cors',
    })
    
    return await response.text()
  } catch (error) {
    console.error('Error fetching page:', error)
    throw error
  }
}

