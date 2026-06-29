/**
 * config.js — Конфигурация приложения (Phase 1 — обновлено)
 *
 * ВАЖНО: Telegram-токен и chatId БОЛЬШЕ НЕ хранятся в front-end коде.
 * Раньше это была критическая уязвимость: любой посетитель мог прочитать токен
 * в DevTools и отправлять сообщения от имени бота.
 *
 * Теперь токен хранится ТОЛЬКО в backend (.env), а front-end обращается к
 * backend-прокси через APP_CONFIG.backend.url.
 *
 * Для локальной разработки без backend оставьте url пустым — формы будут
 * возвращать честное сообщение «форма обратной связи не настроена».
 *
 * Для продакшена:
 *   1. Задеплойте backend (см. backend/README.md)
 *   2. Укажите его URL ниже
 */
const APP_CONFIG = {
    app: { name: 'ФТО', version: '3.2', currency: '₽' },
    contacts: {
        phone: '+7 (960) 178-67-38',
        email: 'a20072005@yandex.ru',
        address: 'г. Нижний Новгород, ул. Тургенева, 9'
    },
    backend: {
        // URL backend-прокси для отправки сообщений в Telegram.
        // Оставьте пустым если backend не задеплоен — формы вернут честную ошибку.
        // Пример: 'https://fto-backend.onrender.com'
        url: ''
    },
    paths: { imagesBase: 'images/' }
};
