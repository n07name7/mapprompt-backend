# ✅ Backend Deployment Checklist

## Подготовка (ГОТОВО)

- ✅ `.gitignore` создан (node_modules, .env, logs)
- ✅ `railway.json` создан (NIXPACKS, npm start, restart policy)
- ✅ `package.json` обновлён:
  - ✅ `main: "server.js"`
  - ✅ `scripts.start: "node server.js"`
  - ✅ `engines.node: ">=18.0.0"`
- ✅ Git репозиторий инициализирован
- ✅ Все файлы закоммичены (2 commits)
- ✅ `.env` НЕ в Git (правильно игнорится)
- ✅ `.env.example` в Git (для документации)
- ✅ `DEPLOY.md` создан
- ✅ `README.md` существует
- ✅ Health check endpoint работает (`/health`)
- ✅ CORS настроен для `https://n07name7.github.io`

---

## Ожидает действий от Ивана

### 1️⃣ Создать GitHub репозиторий

**Команда (самый простой способ):**
```bash
# Установить gh CLI (если нет)
sudo apt install gh

# Авторизоваться
gh auth login

# Создать репо и сразу запушить
cd /home/ivan/clawd/projects/mapprompt-backend
gh repo create n07name7/mapprompt-backend --public --source=. --remote=origin --push
```

**Или вручную:**
1. https://github.com/new
2. Repository name: `mapprompt-backend`
3. Public
4. НЕ создавать README/LICENSE/.gitignore
5. Create repository
6. Выполнить:
```bash
cd /home/ivan/clawd/projects/mapprompt-backend
GIT_SSH_COMMAND="ssh -i ~/.ssh/id_ed25519_github" git push -u origin main
```

---

### 2️⃣ Deploy на Railway.app

1. **Регистрация:** https://railway.app (через GitHub)
2. **New Project** → Deploy from GitHub repo
3. Выбрать: `n07name7/mapprompt-backend`
4. Railway автоматически задеплоит
5. **Settings** → Generate Domain (получить публичный URL)

---

### 3️⃣ Настроить Environment Variables в Railway

Перейти в **Variables** и добавить:

```
NODE_ENV=production
CORS_ORIGIN=https://n07name7.github.io
```

**Важно:** `PORT` не нужно указывать — Railway автоматически его устанавливает!

---

### 4️⃣ Получить Production URL

После деплоя скопировать URL (например):
```
https://mapprompt-backend-production.up.railway.app
```

**Проверить работу:**
```bash
curl https://your-app.railway.app/health
```

Должно вернуть:
```json
{"status":"ok","timestamp":"2026-02-04T10:30:00.000Z"}
```

---

### 5️⃣ Тест API endpoint

```bash
curl -X POST https://your-app.railway.app/api/geocode \
  -H "Content-Type: application/json" \
  -d '{"addresses": ["Václavské náměstí, Praha"]}'
```

---

## После получения URL → Обновление Frontend

Когда Railway URL получен, сообщи мне, и я:
1. Создам `.env` в frontend проекте с `VITE_API_URL`
2. Обновлю код для использования production API
3. Пересоберу и задеплою frontend на GitHub Pages

---

## Timeline

- ✅ **11:29** - Backend подготовлен
- 🟡 **Сейчас** - Ожидает GitHub + Railway
- ⏳ **5-10 минут** - Деплой на Railway
- ⏳ **+5 минут** - Обновление frontend

**Общее время: ~20 минут** (большая часть — регистрация и ожидание)

---

## Troubleshooting

**Проблема:** Railway не может найти start command
- **Решение:** Проверь что `package.json` содержит `"start": "node server.js"`

**Проблема:** CORS ошибка на фронтенде
- **Решение:** Добавь `CORS_ORIGIN=https://n07name7.github.io` в Railway variables

**Проблема:** Port binding error
- **Решение:** Убери `PORT` из variables (Railway сам его устанавливает)

---

**Всё готово! Осталось только GitHub + Railway деплой!** 🚀
