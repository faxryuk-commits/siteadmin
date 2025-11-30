import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface ContentItem {
  id: string
  type: 'text' | 'image' | 'link' | 'section' | 'heading' | 'paragraph' | 'button'
  path: string
  value: string
  label: string
  description?: string
  styles?: Record<string, any>
  children?: ContentItem[]
}

export interface PageStructure {
  id: string
  path: string
  name: string
  sections: ContentItem[]
}

interface ContentContextType {
  pages: PageStructure[]
  currentPage: PageStructure | null
  setCurrentPage: (page: PageStructure | null) => void
  updatePage: (pageId: string, sections: ContentItem[]) => void
  addPage: (page: PageStructure) => void
  deletePage: (pageId: string) => void
  updateContentItem: (pageId: string, itemId: string, updates: Partial<ContentItem>) => void
  addContentItem: (pageId: string, item: ContentItem, parentId?: string) => void
  deleteContentItem: (pageId: string, itemId: string) => void
  syncToSite: () => Promise<void>
}

const ContentContext = createContext<ContentContextType | undefined>(undefined)

const PAGES_KEY = 'delever-admin-pages'

export function ContentProvider({ children }: { children: ReactNode }) {
  const [pages, setPages] = useState<PageStructure[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(PAGES_KEY)
        return stored ? JSON.parse(stored) : []
      }
    } catch (e) {
      console.error('Error reading pages from localStorage:', e)
    }
    return []
  })

  const [currentPage, setCurrentPage] = useState<PageStructure | null>(null)

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(PAGES_KEY, JSON.stringify(pages))
      }
    } catch (e) {
      console.error('Error saving pages to localStorage:', e)
    }
  }, [pages])

  const updatePage = (pageId: string, sections: ContentItem[]) => {
    setPages((prev) =>
      prev.map((page) => (page.id === pageId ? { ...page, sections } : page))
    )
    if (currentPage?.id === pageId) {
      setCurrentPage({ ...currentPage, sections })
    }
  }

  const addPage = (page: PageStructure) => {
    setPages((prev) => [...prev, page])
  }

  const deletePage = (pageId: string) => {
    setPages((prev) => prev.filter((page) => page.id !== pageId))
    if (currentPage?.id === pageId) {
      setCurrentPage(null)
    }
  }

  const updateContentItem = (pageId: string, itemId: string, updates: Partial<ContentItem>) => {
    const updateItem = (items: ContentItem[]): ContentItem[] => {
      return items.map((item) => {
        if (item.id === itemId) {
          return { ...item, ...updates }
        }
        if (item.children) {
          return { ...item, children: updateItem(item.children) }
        }
        return item
      })
    }

    setPages((prev) =>
      prev.map((page) => {
        if (page.id === pageId) {
          return { ...page, sections: updateItem(page.sections) }
        }
        return page
      })
    )

    if (currentPage?.id === pageId) {
      setCurrentPage({
        ...currentPage,
        sections: updateItem(currentPage.sections),
      })
    }
  }

  const addContentItem = (pageId: string, item: ContentItem, parentId?: string) => {
    const addToItems = (items: ContentItem[]): ContentItem[] => {
      if (parentId) {
        return items.map((i) => {
          if (i.id === parentId) {
            return {
              ...i,
              children: [...(i.children || []), item],
            }
          }
          if (i.children) {
            return { ...i, children: addToItems(i.children) }
          }
          return i
        })
      }
      return [...items, item]
    }

    updatePage(pageId, addToItems(currentPage?.sections || []))
  }

  const deleteContentItem = (pageId: string, itemId: string) => {
    const removeItem = (items: ContentItem[]): ContentItem[] => {
      return items
        .filter((item) => item.id !== itemId)
        .map((item) => {
          if (item.children) {
            return { ...item, children: removeItem(item.children) }
          }
          return item
        })
    }

    updatePage(pageId, removeItem(currentPage?.sections || []))
  }

  const syncToSite = async () => {
    try {
      // Импортируем API функции
      const { syncContentToSite } = await import('@/lib/api')
      
      await syncContentToSite({
        pages,
        content: [],
        navigation: [],
        footerLinks: [],
      })
      
      console.log('Синхронизация с сайтом успешна')
    } catch (error) {
      console.error('Ошибка синхронизации:', error)
      // Данные сохранены в localStorage как fallback
      throw error
    }
  }

  return (
    <ContentContext.Provider
      value={{
        pages,
        currentPage,
        setCurrentPage,
        updatePage,
        addPage,
        deletePage,
        updateContentItem,
        addContentItem,
        deleteContentItem,
        syncToSite,
      }}
    >
      {children}
    </ContentContext.Provider>
  )
}

export function useContent() {
  const context = useContext(ContentContext)
  if (!context) {
    throw new Error('useContent must be used within ContentProvider')
  }
  return context
}

