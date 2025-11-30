# Деплой админ-панели Delever

## Шаг 1: Создание нового репозитория на GitHub

1. Перейдите на GitHub и создайте новый репозиторий:
   - Название: `delever-admin` (или `delever-cms`)
   - Видимость: Private (рекомендуется)
   - НЕ добавляйте README, .gitignore или лицензию

2. Скопируйте URL репозитория (например: `https://github.com/ваш-username/delever-admin.git`)

## Шаг 2: Подключение к репозиторию

```bash
cd delever-admin
git remote add origin https://github.com/ваш-username/delever-admin.git
git branch -M main
git push -u origin main
```

## Шаг 3: Деплой на Vercel

### Вариант A: Через веб-интерфейс Vercel

1. Зайдите на [vercel.com](https://vercel.com)
2. Нажмите "Add New Project"
3. Импортируйте репозиторий `delever-admin`
4. Настройки:
   - Framework Preset: Vite
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

### Вариант B: Через Vercel CLI

```bash
npm i -g vercel
cd delever-admin
vercel
```

## Шаг 4: Настройка домена

1. В настройках проекта Vercel перейдите в "Domains"
2. Добавьте поддомен: `admin.delever.io`
3. Настройте DNS записи у регистратора домена:
   - Тип: CNAME
   - Имя: `admin`
   - Значение: `cname.vercel-dns.com` (или значение, указанное Vercel)

## Шаг 5: Настройка переменных окружения

В Vercel добавьте переменные окружения:

```
VITE_API_URL=https://api.delever.io
VITE_SITE_URL=https://delever.io
```

## Шаг 6: Подключение к основному сайту

### Вариант 1: Через API (рекомендуется)

Создайте API endpoints на основном сайте для:
- Получения контента: `GET /api/content`
- Синхронизации контента: `POST /api/content/sync`
- Публикации изменений: `POST /api/content/publish`

### Вариант 2: Через общую базу данных

Используйте общую базу данных (например, Firebase, Supabase) для хранения контента.

### Вариант 3: Через localStorage + синхронизация

Временно можно использовать localStorage с ручной синхронизацией через экспорт/импорт JSON.

## Структура API (пример)

```typescript
// GET /api/content
{
  pages: PageStructure[],
  navigation: NavigationItem[],
  footerLinks: FooterLink[]
}

// POST /api/content/sync
Body: {
  pages: PageStructure[],
  content: ContentItem[],
  navigation: NavigationItem[],
  footerLinks: FooterLink[]
}
Response: { success: true }
```

## Проверка работы

1. Откройте `https://admin.delever.io`
2. Войдите с данными: `admin@delever.io` / `admin123`
3. Проверьте синхронизацию с основным сайтом

## Безопасность

⚠️ **Важно перед продакшеном:**

1. Измените пароль по умолчанию
2. Настройте реальную аутентификацию (JWT, OAuth)
3. Добавьте CORS настройки на API
4. Используйте HTTPS
5. Ограничьте доступ по IP (опционально)

