# Настройка GitHub репозитория для админ-панели

## Шаг 1: Создайте новый репозиторий на GitHub

1. Перейдите на https://github.com/new
2. Заполните:
   - Repository name: `delever-admin`
   - Description: `Visual content editor for Delever website`
   - Visibility: **Private** (рекомендуется)
   - НЕ добавляйте README, .gitignore или лицензию
3. Нажмите "Create repository"

## Шаг 2: Подключите локальный репозиторий

```bash
cd delever-admin

# Добавьте remote (замените YOUR_USERNAME на ваш GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/delever-admin.git

# Переименуйте ветку в main (если нужно)
git branch -M main

# Отправьте код
git push -u origin main
```

## Шаг 3: Деплой на Vercel

### Через веб-интерфейс:

1. Зайдите на https://vercel.com
2. Нажмите "Add New Project"
3. Выберите репозиторий `delever-admin`
4. Настройки:
   - Framework Preset: **Vite**
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Добавьте переменные окружения:
   - `VITE_API_URL` = `https://api.delever.io`
   - `VITE_SITE_URL` = `https://delever.io`
6. Нажмите "Deploy"

### Настройка домена:

1. В настройках проекта Vercel → "Domains"
2. Добавьте: `admin.delever.io`
3. Настройте DNS у регистратора:
   - Тип: **CNAME**
   - Имя: `admin`
   - Значение: значение, указанное Vercel (обычно `cname.vercel-dns.com`)

## Шаг 4: Проверка

После деплоя откройте `https://admin.delever.io` и проверьте работу.

## Важно

- Измените пароль по умолчанию перед продакшеном
- Настройте API endpoints на основном сайте для синхронизации
- Используйте HTTPS для безопасности

