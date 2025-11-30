# Быстрый старт - Деплой админ-панели

## 🚀 Шаг 1: Создайте репозиторий на GitHub

1. Перейдите на https://github.com/new
2. Название: `delever-admin`
3. Видимость: **Private**
4. НЕ добавляйте файлы
5. Нажмите "Create repository"

## 📤 Шаг 2: Отправьте код

```bash
cd delever-admin

# Добавьте remote (замените YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/delever-admin.git

# Отправьте код
git push -u origin main
```

## 🌐 Шаг 3: Деплой на Vercel

1. Зайдите на https://vercel.com
2. "Add New Project" → выберите `delever-admin`
3. Настройки:
   - Framework: **Vite**
   - Build: `npm run build`
   - Output: `dist`
4. Добавьте переменные:
   - `VITE_SITE_URL` = `https://delever.io`
   - `VITE_API_URL` = `https://api.delever.io` (или ваш API)
5. Deploy!

## 🔗 Шаг 4: Настройте домен

1. В Vercel → Settings → Domains
2. Добавьте: `admin.delever.io`
3. Настройте DNS:
   - CNAME: `admin` → значение от Vercel

## ✅ Готово!

Откройте `https://admin.delever.io` и войдите:
- Email: `admin@delever.io`
- Пароль: `admin123`

## 🔧 Подключение к сайту

Админка автоматически подключается к основному сайту через:
- Iframe для предпросмотра
- API для синхронизации (настройте endpoints на бэкенде)

Подробнее: [DEPLOY.md](./DEPLOY.md)

