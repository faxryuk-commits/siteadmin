# Настройка админ-панели Delever

## Установка

```bash
cd delever-admin
npm install
```

## Запуск

```bash
npm run dev
```

Админ-панель будет доступна на `http://localhost:5174`

## Вход

- Email: `admin@delever.io`
- Пароль: `admin123`

## Возможности визуального редактора

### 1. Редактирование контента
- Кликните на любой элемент на странице для редактирования
- Изменения сохраняются автоматически
- Редактирование прямо в предпросмотре

### 2. Добавление элементов
- Используйте панель слева для добавления новых элементов
- Доступны: заголовки, текст, изображения, кнопки

### 3. Drag-and-Drop
- Перетаскивайте элементы для изменения порядка
- Реорганизуйте структуру страницы

### 4. Синхронизация
- Нажмите "Синхронизировать" для отправки изменений на сайт
- Изменения применяются в реальном времени

## Деплой

### На Vercel

1. Подключите репозиторий к Vercel
2. Настройте домен: `admin.delever.io`
3. Build Command: `npm run build`
4. Output Directory: `dist`

### Настройка поддомена

1. В DNS настройках добавьте CNAME запись:
   - Имя: `admin`
   - Значение: `cname.vercel-dns.com`
2. В Vercel добавьте домен `admin.delever.io`

## API интеграция

Для синхронизации с основным сайтом нужно:

1. Создать API endpoint на бэкенде
2. Обновить функцию `syncToSite` в `ContentContext.tsx`
3. Настроить CORS для разрешения запросов

Пример:

```typescript
const syncToSite = async () => {
  const response = await fetch('https://api.delever.io/content/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ pages })
  })
  // ...
}
```

## Структура проекта

```
delever-admin/
├── src/
│   ├── components/
│   │   ├── VisualEditor.tsx    # Визуальный редактор
│   │   └── ProtectedRoute.tsx   # Защита роутов
│   ├── contexts/
│   │   ├── AuthContext.tsx      # Аутентификация
│   │   └── ContentContext.tsx   # Управление контентом
│   ├── pages/
│   │   ├── Login.tsx            # Страница входа
│   │   └── Dashboard.tsx        # Главная панель
│   └── App.tsx                  # Роутинг
```

