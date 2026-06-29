/**
 * config.js — Конфигурация приложения (Phase 2)
 *
 * ВАЖНО: Telegram ИНТЕГРАЦИЯ ПОЛНОСТЬЮ УБРАНА.
 * Согласно требованию пользователя, Telegram заблокирован в России,
 * поэтому все уведомления теперь приходят на электронную почту.
 *
 * Email-уведомления отправляются через backend-прокси:
 *   - front-end вызывает POST /api/send на backendUrl
 *   - backend использует nodemailer + SMTP Mail.ru
 *   - письма приходят на alfat@list.ru (для тестов)
 *
 * Для продакшена:
 *   1. Задеплойте backend (см. backend/README.md)
 *   2. Укажите его URL ниже в backendUrl
 *   3. Настройте .env на backend (SMTP_USER, SMTP_PASS, EMAIL_TO)
 */
const APP_CONFIG = {
    app: { name: 'ФТО', version: '4.0', currency: '₽' },
    contacts: {
        phone: '+7 (960) 178-67-38',
        email: 'a20072005@yandex.ru',
        address: 'г. Нижний Новгород, ул. Тургенева, 9'
    },
    backend: {
        // URL backend-прокси для отправки писем.
        // Оставьте пустым если backend не задеплоен — формы вернут честную ошибку.
        // Пример: 'https://fto-backend.onrender.com'
        url: ''
    },
    paths: { imagesBase: 'images/' }
};
