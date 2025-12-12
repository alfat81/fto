# Фабрика торгового оборудования

Сайт фабрики торгового оборудования в Нижнем Новгороде.

## Контакты:
- **Телефон:** +7 (960) 178-67-38
- **Email:** a20072005@yandex.ru  
- **Адрес:** ул. Тургенева, 9, Нижний Новгород
- **Сайт:** https://alfat81.github.io/fto/

## Технологии:
- **Фронтенд:** HTML5, CSS3, JavaScript
- **Бэкенд:** Node.js, Express, Telegram API
- **Хостинг:** GitHub Pages (фронтенд), Render.com (бэкенд)
- **Демо:** https://alfat81.github.io/fto/

## Особенности:
- ✅ Современный адаптивный дизайн с параллакс эффектами
- ✅ Полнофункциональная корзина товаров
- ✅ Отправка заказов через Telegram бота
- ✅ Валидация данных перед отправкой
- ✅ Уведомления об успехе и ошибках
- ✅ Оптимизация для мобильных устройств

## Настройка:

### 1. Фронтенд (GitHub Pages):
1. Все файлы фронтенда находятся в папке `docs/`
2. В настройках GitHub Pages выберите:
   - Branch: `main`
   - Folder: `/docs`
3. Сайт будет доступен по адресу: `https://alfat81.github.io/fto/`

### 2. Бэкенд (Render.com):
1. Зарегистрируйтесь на https://render.com
2. Создайте Web Service из этого репозитория
3. В Root Directory укажите: `backend`
4. Добавьте Environment Variables:
   - TELEGRAM_BOT_TOKEN: ваш токен Telegram бота
   - TELEGRAM_CHAT_ID: ваш ID чата
   - CORS_ORIGIN: https://alfat81.github.io
5. Build Command: `npm install`
6. Start Command: `npm start`

## Лицензия:
MIT License
