# Интеграция сайта с админкой

## Проблема

Сайт возвращает `401 Unauthorized` и блокирует загрузку в iframe (`X-Frame-Options: DENY`). Нужно настроить сайт для работы с админкой.

## Решение

### 1. Настройка авторизации

Сайт должен проверять параметр `admin_token` и пропускать авторизацию, если токен валидный.

#### Для Next.js (App Router)

Создайте или обновите `middleware.ts`:

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const adminToken = searchParams.get('admin_token')
  const editMode = searchParams.get('edit_mode')

  // Если есть валидный токен админки, пропускаем без авторизации
  if (adminToken === 'admin-access' && editMode === 'true') {
    // Создаем ответ без проверки авторизации
    const response = NextResponse.next()
    
    // Убираем X-Frame-Options для админки
    response.headers.delete('x-frame-options')
    response.headers.set('X-Frame-Options', 'SAMEORIGIN')
    
    return response
  }

  // Иначе проверяем обычную авторизацию
  // ... ваш существующий код авторизации
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

#### Для Next.js (Pages Router)

Создайте `middleware.ts` в корне проекта:

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const adminToken = url.searchParams.get('admin_token')
  const editMode = url.searchParams.get('edit_mode')

  if (adminToken === 'admin-access' && editMode === 'true') {
    const response = NextResponse.next()
    response.headers.set('X-Frame-Options', 'SAMEORIGIN')
    return response
  }

  return NextResponse.next()
}
```

#### Для Express.js / Node.js

```javascript
app.use((req, res, next) => {
  const adminToken = req.query.admin_token
  const editMode = req.query.edit_mode

  // Если есть валидный токен админки
  if (adminToken === 'admin-access' && editMode === 'true') {
    // Пропускаем авторизацию
    res.setHeader('X-Frame-Options', 'SAMEORIGIN')
    return next()
  }

  // Иначе проверяем обычную авторизацию
  // ... ваш код авторизации
  next()
})
```

### 2. Настройка заголовков в Vercel

Если используете Vercel, создайте или обновите `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        }
      ],
      "has": [
        {
          "type": "query",
          "key": "admin_token",
          "value": "admin-access"
        },
        {
          "type": "query",
          "key": "edit_mode",
          "value": "true"
        }
      ]
    }
  ]
}
```

### 3. Безопасность токена

Для продакшена используйте более безопасный токен:

1. Создайте переменную окружения `ADMIN_EDIT_TOKEN` на сайте
2. Обновите админку для использования этого токена
3. Проверяйте токен на сайте:

```typescript
const ADMIN_TOKEN = process.env.ADMIN_EDIT_TOKEN || 'admin-access'

if (adminToken === ADMIN_TOKEN && editMode === 'true') {
  // Разрешаем доступ
}
```

### 4. Альтернативный вариант: API endpoint

Если нельзя изменить основную логику авторизации, создайте специальный endpoint:

```typescript
// pages/api/admin-preview.ts или app/api/admin-preview/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const adminToken = searchParams.get('admin_token')
  const path = searchParams.get('path') || '/'

  if (adminToken !== 'admin-access') {
    return new Response('Unauthorized', { status: 401 })
  }

  // Загружаем контент страницы без авторизации
  // ... ваш код загрузки контента

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html',
      'X-Frame-Options': 'SAMEORIGIN',
    },
  })
}
```

И обновите админку для использования этого endpoint:

```typescript
const iframeUrl = `${SITE_URL}/api/admin-preview?admin_token=${adminToken}&path=${pagePath}`
```

## Проверка

После настройки:

1. Откройте админку
2. Перейдите в раздел "Редактор"
3. Проверьте Network tab в DevTools:
   - Статус должен быть `200 OK` вместо `401 Unauthorized`
   - `X-Frame-Options` должен быть `SAMEORIGIN` или отсутствовать
4. Сайт должен загрузиться в iframe
5. Элементы должны автоматически загрузиться

## Отладка

Если проблемы остаются:

1. Проверьте, что параметры `admin_token` и `edit_mode` передаются в URL
2. Проверьте логи на сервере
3. Убедитесь, что middleware/обработчик срабатывает
4. Проверьте заголовки ответа в Network tab

