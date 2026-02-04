# Деплой MapPrompt Backend API

## 🚂 Railway.app (Рекомендуется)

### Метод 1: Через GitHub

1. **Подготовь репозиторий**
```bash
cd /home/ivan/clawd/projects/mapprompt-backend
git init
git add .
git commit -m "Initial commit: MapPrompt Backend API"
```

2. **Запуш на GitHub**
```bash
# Создай репозиторий на GitHub (https://github.com/new)
git remote add origin https://github.com/YOUR_USERNAME/mapprompt-backend.git
git branch -M main
git push -u origin main
```

3. **Задеплой на Railway**
   - Зайди на [railway.app](https://railway.app)
   - **New Project** → **Deploy from GitHub repo**
   - Выбери `mapprompt-backend`
   - Railway автоматически развернёт проект
   - Получишь URL типа: `https://mapprompt-backend-production.up.railway.app`

### Метод 2: Через Railway CLI

```bash
# Установи Railway CLI
npm install -g @railway/cli

# Залогинься
railway login

# Инициализируй проект
cd /home/ivan/clawd/projects/mapprompt-backend
railway init

# Задеплой
railway up
```

### Проверка деплоя
```bash
# Замени URL на свой Railway URL
curl https://your-project.up.railway.app/health

# Тестируй геокодирование
curl -X POST https://your-project.up.railway.app/api/geocode \
  -H "Content-Type: application/json" \
  -d '{"addresses": ["Václavské náměstí, Praha"]}'
```

---

## 🎨 Render.com (Альтернатива)

1. **Зайди на** [render.com](https://render.com)
2. **New** → **Web Service**
3. **Connect GitHub** репозиторий
4. **Настройки:**
   - Name: `mapprompt-backend`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance Type: `Free`
5. **Create Web Service**

---

## 🐳 Docker (Если нужен)

### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
    restart: unless-stopped
```

### Запуск
```bash
docker build -t mapprompt-backend .
docker run -p 3000:3000 mapprompt-backend
```

---

## ⚙️ Переменные окружения

### Railway/Render
В настройках проекта добавь:
```
PORT=3000  # Railway автоматически установит свой порт
NODE_ENV=production
```

### Local
Скопируй `.env.example` в `.env`:
```bash
cp .env.example .env
```

---

## 🔧 После деплоя

### 1. Обнови CORS в `server.js`
```js
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://n07name7.github.io',
    'https://your-railway-url.up.railway.app'  // ✅ Добавь свой URL
  ]
}));
```

### 2. Закоммить изменения
```bash
git add server.js
git commit -m "Update CORS origins"
git push
```

Railway автоматически задеплоит новую версию.

---

## 📊 Мониторинг

### Railway Dashboard
- **Логи:** https://railway.app → твой проект → Deployments → Logs
- **Метрики:** CPU, Memory, Network usage
- **URL:** Копируй публичный URL из Settings

### Health Check
Добавь в мониторинг (Uptime Robot, Pingdom):
```
https://your-url.up.railway.app/health
```

---

## 💰 Лимиты бесплатных планов

### Railway
- **$5 бесплатно каждый месяц** (500 часов)
- После исчерпания - платно ($0.01/час)

### Render
- **750 часов/месяц бесплатно**
- Sleep после 15 минут неактивности (первый запрос медленный)

---

## 🚀 Готово!

После деплоя твой API будет доступен по публичному URL. Используй его во фронтенде:

```js
const API_URL = 'https://your-railway-url.up.railway.app';

const response = await fetch(`${API_URL}/api/geocode`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    addresses: ['Václavské náměstí, Praha'] 
  })
});

const data = await response.json();
console.log(data.results);
```
