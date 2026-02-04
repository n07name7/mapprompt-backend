# MapPrompt Backend API

Backend API для геокодирования адресов и получения POI (Points of Interest) через OpenStreetMap.

## 🚀 Быстрый старт

### Установка

```bash
npm install
```

### Запуск

**Development mode (с автоперезагрузкой):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Сервер запустится на `http://localhost:3000`

## 📡 API Endpoints

### POST /api/geocode

Геокодирование списка адресов с получением POI в радиусе 500м.

**Request:**
```json
{
  "addresses": [
    "Václavské náměstí 1, Praha",
    "Karlovo náměstí 13, Praha 2"
  ]
}
```

**Response:**
```json
{
  "results": [
    {
      "address": "Václavské náměstí 1, Praha",
      "status": "success",
      "data": {
        "lat": 50.0808,
        "lon": 14.4262,
        "display_name": "1, Václavské náměstí, Nové Město, Praha 1, ...",
        "address_details": { ... },
        "poi_nearby": {
          "transport": [
            { "name": "Metro Muzeum", "type": "station", "distance": 150 }
          ],
          "schools": [
            { "name": "Gymnázium Jana Nerudy", "type": "school", "distance": 320 }
          ],
          "shops": [
            { "name": "Tesco", "type": "supermarket", "distance": 210 }
          ]
        }
      }
    }
  ]
}
```

**Error статусы:**
- `not_found` - адрес не найден
- `error` - ошибка API или таймаут

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-04T10:30:00.000Z"
}
```

## 🧪 Тестирование

```bash
# Простой тест
curl -X POST http://localhost:3000/api/geocode \
  -H "Content-Type: application/json" \
  -d '{"addresses": ["Václavské náměstí, Praha"]}'

# Health check
curl http://localhost:3000/health
```

## ⚙️ Структура проекта

```
mapprompt-backend/
├── server.js              # Главный файл сервера
├── routes/
│   └── geocode.js        # POST /api/geocode
├── services/
│   ├── nominatim.js      # Геокодирование через Nominatim OSM
│   └── overpass.js       # POI через Overpass API
├── utils/
│   └── rateLimit.js      # Rate limiting (1 req/sec для Nominatim)
├── .env                  # Конфигурация (PORT)
└── package.json
```

## 🌍 Используемые API

- **Nominatim OSM** - геокодирование адресов
  - URL: `https://nominatim.openstreetmap.org/search`
  - Rate limit: 1 запрос/секунду
  - User-Agent: `MapPrompt.cz/1.0 (contact@mapprompt.cz)`

- **Overpass API** - поиск POI
  - URL: `https://overpass-api.de/api/interpreter`
  - Радиус поиска: 500 метров
  - Категории: школы, магазины, транспорт

## 📦 Деплой на Railway.app

1. Создай аккаунт на [Railway.app](https://railway.app)
2. Подключи GitHub репозиторий
3. Railway автоматически определит Node.js проект
4. Добавь переменную окружения: `PORT=3000` (или используй динамический порт Railway)
5. Deploy!

**Важно:** Railway автоматически устанавливает `PORT` переменную. Используй:
```js
const PORT = process.env.PORT || 3000;
```

## ⚠️ Ограничения

- Максимум 10 адресов за один запрос
- Таймаут запроса: 30 секунд
- Rate limit для Nominatim: 1 запрос/секунду (автоматически соблюдается)
- Публичные API — для production рекомендуется использовать собственные инстансы

## 📝 Лицензия

ISC
# Last update: Ср 04 фев 2026 16:18:22 CET
