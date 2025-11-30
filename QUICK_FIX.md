# Быстрое решение для связи сайта и админки

## Проблема
Сайт возвращает `401 Unauthorized` и блокирует загрузку в iframe.

## Быстрое решение (5 минут)

### Вариант 1: Vercel Headers (самый простой)

Добавьте в `vercel.json` на сайте:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "has": [
        {
          "type": "query",
          "key": "admin_token",
          "value": "admin-access"
        }
      ],
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        }
      ]
    }
  ]
}
```

### Вариант 2: Next.js Middleware

Создайте `middleware.ts` в корне сайта:

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const adminToken = searchParams.get('admin_token')
  const editMode = searchParams.get('edit_mode')

  if (adminToken === 'admin-access' && editMode === 'true') {
    const response = NextResponse.next()
    response.headers.set('X-Frame-Options', 'SAMEORIGIN')
    // Пропускаем авторизацию для админки
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
}
```

### Вариант 3: Временное отключение авторизации

Если используете Vercel Authentication, временно отключите его для путей с `admin_token`:

В настройках Vercel проекта:
1. Перейдите в Settings → Authentication
2. Добавьте исключение для путей с `admin_token`

Или в коде:

```typescript
// В вашем auth middleware
if (request.url.includes('admin_token=admin-access')) {
  return NextResponse.next() // Пропускаем авторизацию
}
```

## После настройки

1. Закоммитьте изменения на сайте
2. Задеплойте сайт
3. Обновите админку - сайт должен загрузиться

## Проверка

Откройте в браузере:
```
https://delever-site-plh9d7t0b-fakhriddins-projects-e76e6079.vercel.app/?admin_token=admin-access&edit_mode=true
```

Должно работать без 401 ошибки.

