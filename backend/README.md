# FTO Backend v2.0 — отправка заявок на email

Backend-прокси для приёма форм с сайта ФТО и отправки их на электронную почту через SMTP Mail.ru.

## Что изменилось по сравнению с v1.0

| Было (v1.0) | Стало (v2.0) |
|-------------|--------------|
| Telegram-бот для приёма заявок | **Email** через SMTP Mail.ru |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | `SMTP_USER`, `SMTP_PASS`, `EMAIL_TO` |
| Зависимость от доступности Telegram в РФ | Работает через российский SMTP Mail.ru |

Причина перехода: **Telegram заблокирован в России**, заявки с сайта через Telegram-бота не доходили.

## Как работает

```
[Пользователь на сайте]
       │
       │ POST /api/send
       │ { subject, text }
       ▼
[Backend на Render.com]
       │
       │ nodemailer.sendMail()
       │ SMTP: smtp.mail.ru:465 (SSL)
       ▼
[Ящик alfat@list.ru] ← письмо с заявкой
```

## Локальный запуск

```bash
cd backend
cp .env.example .env
# Отредактируйте .env:
#   - SMTP_USER = alfat@list.ru
#   - SMTP_PASS = пароль приложения Mail.ru (см. ниже)
#   - EMAIL_TO  = alfat@list.ru (куда отправлять)
npm install
npm start
# → ✓ FTO backend v2.0 listening on port 10000
```

Проверка:
```bash
curl http://localhost:10000/api/health
# → { "ok": true, "smtp_configured": true, "email_to": "alfat@list.ru" }

curl -X POST http://localhost:10000/api/send \
  -H "Content-Type: application/json" \
  -d '{"subject":"🔔 Тестовое письмо","text":"Проверка отправки через SMTP Mail.ru"}'
# → { "ok": true, "messageId": "<...@mail.ru>" }
```

## Получение пароля приложения Mail.ru

Mail.ru не разрешает использовать основной пароль от ящика для SMTP. Нужен **пароль приложения**:

1. Зайдите в настройки безопасности Mail.ru: <https://my.mail.ru/cgi-bin/security?allow_external_apps=1>
2. Включите «Внешние приложения» (если выключено)
3. Нажмите «Создать пароль приложения»
4. Введите название (например, «FTO backend»)
5. Скопируйте сгенерированный пароль (16 символов)
6. Вставьте в `.env` в `SMTP_PASS`

Подробнее: <https://help.mail.ru/mail/security/protection/external>

## Деплой на Render.com

1. <https://render.com> → New → Web Service → подключите репозиторий GitHub
2. Настройки:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** `Node` (>=18)
3. Переменные окружения (Environment → Add Environment Variable):

| Ключ | Значение |
|------|----------|
| `SMTP_HOST` | `smtp.mail.ru` |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | `alfat@list.ru` |
| `SMTP_PASS` | пароль приложения Mail.ru |
| `EMAIL_FROM` | `Сайт ФТО` |
| `EMAIL_TO` | `alfat@list.ru` (для тестов) |
| `CORS_ORIGIN` | `https://alfat81.github.io` |

4. Deploy → получите URL вида `https://fto-backend-xxxx.onrender.com`
5. Health check: откройте `https://fto-backend-xxxx.onrender.com/api/health` в браузере

## Подключение к фронтенду

После деплоя откройте `docs/js/config.js` и впишите URL backend:

```js
backend: {
    url: 'https://fto-backend-xxxx.onrender.com'
}
```

Готово — формы на сайте начнут отправлять письма на `alfat@list.ru`.

## Безопасность

- ✅ SMTP-пароль хранится в env переменных (не в коде, не в front-end)
- ✅ Rate limiting: 5 запросов в минуту на IP
- ✅ CORS ограничен одним origin (GitHub Pages)
- ✅ Валидация длины сообщения (макс. 10000 символов)
- ✅ HTML-экранирование в письмах для защиты от mail-injection
- ✅ Логи отправленных писем в stdout (без раскрытия PII)

## Структура писем

**Тема** формируется в зависимости от типа формы:

| Форма | Тема письма |
|-------|-------------|
| Расчёт стоимости (главная) | `📋 ЗАЯВКА НА РАСЧЁТ СТОИМОСТИ` |
| Заказ из корзины | `🛒 НОВЫЙ ЗАКАЗ с сайта ФТО` |
| Сообщение с контактов | `📨 Новое сообщение с сайта ФТО` |

**Тело письма** содержит все поля формы + timestamp + страницу-источник.

## Endpoints

| Method | Path | Описание |
|--------|------|----------|
| GET | `/` | Health check (JSON) |
| GET | `/api/health` | Health check (JSON) |
| POST | `/api/send` | Отправка email. Body: `{"subject":"...","text":"..."}` |

## Альтернативные SMTP

Если Mail.ru не подходит, можно использовать:

| Провайдер | HOST | PORT | Примечание |
|-----------|------|------|------------|
| Mail.ru | `smtp.mail.ru` | 465 | Российский, бесплатный |
| Yandex | `smtp.yandex.ru` | 465 | Российский, бесплатный, нужен пароль приложения |
| Gmail | `smtp.gmail.com` | 465 | Может блокироваться в РФ, нужен app password |
| Beget | `smtp.beget.com` | 465 | Российский хостинг, при наличии тарифа |

Достаточно поменять `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` в `.env`.
