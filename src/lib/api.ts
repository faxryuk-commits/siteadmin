// API для синхронизации с основным сайтом

const API_URL = import.meta.env.VITE_API_URL || 'https://api.delever.io'
const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://delever.io'

export interface SyncRequest {
  pages: any[]
  content: any[]
  navigation: any[]
  footerLinks: any[]
}

export async function syncContentToSite(data: SyncRequest): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/content/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('admin-token') || ''}`,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error('Ошибка синхронизации')
    }

    return await response.json()
  } catch (error) {
    console.error('Sync error:', error)
    // Fallback: сохраняем в localStorage для ручной синхронизации
    localStorage.setItem('delever-pending-sync', JSON.stringify(data))
    throw error
  }
}

export async function fetchSiteContent(): Promise<any> {
  try {
    const response = await fetch(`${SITE_URL}/api/content`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Ошибка загрузки контента')
    }

    return await response.json()
  } catch (error) {
    console.error('Fetch error:', error)
    return null
  }
}

export async function publishChanges(pageId: string): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/content/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('admin-token') || ''}`,
      },
      body: JSON.stringify({ pageId }),
    })

    if (!response.ok) {
      throw new Error('Ошибка публикации')
    }
  } catch (error) {
    console.error('Publish error:', error)
    throw error
  }
}

