# FTO Backend

Backend-прокси для безопасной отправки сообщений из форм сайта в Telegram.

## Зачем нужен

В исходной версии сайта Telegram-токен бота хранился в `docs/js/config.js` в открытом виде — это означало, что любой посетитель мог прочитать токен в DevTools и отправлять произвольные сообщения от имени вашего бота.

В Phase 1 токен перенесён в переменные окружения сервера. Фронтенд вызывает `POST /api/send`, а backend проксирует запрос в Telegram Bot API, не раскрывая токен.

## Локальный запуск

```bash
cd backend
cp .env.example .env
# Отредактируйте .env: впишите TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID
npm install
npm start
# → ✓ FTO backend listening on port 10000
```

Проверка работоспособности:
```bash
curl http://localhost:10000/api/health
# → { "ok": true, "telegram_configured": true }
```

Тест отправки:
```bash
curl -X POST http://localhost:10000/api/send \
  -H "Content-Type: application/json" \
  -d '{"text":"🔔 Тестовое сообщение из FTO backend"}'
# → { "ok": true }
```

## Деплой на Render.com

1. Зарегистрируйтесь на https://render.com
2. **New → Web Service** → подключите репозиторий GitHub
3. Настройки:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** `Node`
4. Переменные окружения (Environment → Add Environment Variable):
   - `TELEGRAM_BOT_TOKEN` — токен бота от @BotFather
   - `TELEGRAM_CHAT_ID` — ID чата для приёма сообщений
   - `CORS_ORIGIN` — `https://alfat81.github.io`
   - (PORT Render задаёт автоматически)
5. Deploy → получите URL вида `https://fto-backend-xxxx.onrender.com`

## Подключение к фронтенду

После деплоя откройте `docs/js/config.js` и впишите URL вашего backend:

```js
backend: {
    url: 'https://fto-backend-xxxx.onrender.com'
}
```

Сайт начнёт отправлять заказы и сообщения из формы контактов через backend.

## Получение Telegram-токена и chat ID

1. Откройте [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте `/newbot`, придумайте имя и username
3. Получите токен вида `1234567890:ABC...XYZ`
4. Создайте группу (или используйте личный чат с ботом)
5. Добавьте бота в группу (если используете группу)
6. Отправьте любое сообщение в чат/группу
7. Откройте в браузере:
   `https://api.telegram.org/bot<ВАШ_ТОКЕН>/getUpdates`
8. Найдите в JSON-ответе `"chat":{"id": 123456789}` — это ваш `TELEGRAM_CHAT_ID`

## Безопасность

- ✅ Токен хранится только в env переменных (не в коде)
- ✅ Rate limiting: 5 запросов в минуту на IP
- ✅ CORS ограничен одним origin (GitHub Pages)
- ✅ Валидация длины сообщения (макс. 4000 символов)
- ✅ Логи отправленных сообщений в stdout (без раскрытия PII)

## Endpoints

| Method | Path | Описание |
|--------|------|----------|
| GET | `/` | Health check (JSON) |
| GET | `/api/health` | Health check (JSON) |
| POST | `/api/send` | Отправка сообщения в Telegram. Body: `{"text":"..."}` |
