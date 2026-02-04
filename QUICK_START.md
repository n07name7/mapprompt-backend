# 🚀 Quick Start: Deploy to Railway

**Backend готов!** Всё что нужно — создать GitHub репо и задеплоить.

---

## Step 1: Push to GitHub (2 минуты)

### Вариант A: gh CLI (рекомендуется)
```bash
cd /home/ivan/clawd/projects/mapprompt-backend
gh repo create n07name7/mapprompt-backend --public --source=. --remote=origin --push
```

### Вариант B: Вручную
1. Создай репо: https://github.com/new (название: `mapprompt-backend`)
2. НЕ создавай README/.gitignore (они уже есть)
3. Выполни:
```bash
cd /home/ivan/clawd/projects/mapprompt-backend
GIT_SSH_COMMAND="ssh -i ~/.ssh/id_ed25519_github" git push -u origin main
```

---

## Step 2: Deploy on Railway (5 минут)

1. **Регистрация:** https://railway.app (GitHub login)
2. **New Project** → Deploy from GitHub repo
3. Выбери: `n07name7/mapprompt-backend`
4. Railway автоматически задеплоит
5. **Settings** → Generate Domain → копируй URL

### Environment Variables (добавить в Railway):
```
NODE_ENV=production
CORS_ORIGIN=https://n07name7.github.io
```

❗ **НЕ добавляй `PORT`** — Railway сам установит!

---

## Step 3: Test & Get URL

После деплоя проверь:
```bash
curl https://your-app.railway.app/health
```

Должно вернуть: `{"status":"ok","timestamp":"..."}`

**Скопируй URL и сообщи мне!** Я обновлю frontend и всё заработает онлайн 🎉

---

## Troubleshooting

**Q: Build failed**  
A: Проверь что в `package.json` есть `"start": "node server.js"`

**Q: CORS error**  
A: Добавь `CORS_ORIGIN=https://n07name7.github.io` в Railway variables

**Q: Port error**  
A: Убери `PORT` из variables (Railway сам установит)

---

**Время: ~10 минут | Сложность: 🟢 Easy**
