/**
 * docs/js/config.js
 * Глобальная конфигурация проекта
 */

const APP_CONFIG = {
    app: {
        name: 'ФТО | Фабрика Торгового Оборудования',
        version: '3.0',
        currency: '₽'
    },
    
    contacts: {
        phone: '+7 (960) 178-67-38',
        email: 'a20072005@yandex.ru',
        address: 'г. Нижний Новгород, ул. Тургенева, 9'
    },

    // НАСТРОЙКИ TELEGRAM (Заполнить обязательно!)
    telegram: {
        token: 'ВАШ_ТОКЕН_БОТА',       // Например: 601234567:AAH...
        chatId: 'ВАШ_CHAT_ID'         // Например: 123456789
    },

    paths: {
        imagesBase: 'images/' // Базовый путь к картинкам
    }
};