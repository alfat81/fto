/**
 * config.js
 * Конфигурация проекта ftoshop.ru
 * ВНИМАНИЕ: Токен бота виден в коде. Это допустимо для простых сайтов-визиток,
 * но не рекомендуется для высоконагруженных проектов с секретными данными.
 */

const APP_CONFIG = {
    app: {
        name: 'Фабрика Торгового Оборудования',
        version: '3.0.0 (Serverless)',
        currency: '₽',
        locale: 'ru-RU'
    },

    contacts: {
        phone: '+7 (960) 178-67-38',
        email: 'a20072005@yandex.ru',
        address: 'г. Нижний Новгород, ул. Тургенева, 9',
        workingHours: 'Пн-Пт: 9:00 - 18:00'
    },

    // Настройки Telegram (ПРЯМАЯ ОТПРАВКА)
    telegram: {
        // ВСТАВЬТЕ СЮДА ТОКЕН ОТ @BotFather
        token: 'ВАШ_ТОКЕН_БОТА', 
        
        // ВСТАВЬТЕ СЮДА ВАШ CHAT_ID (цифры)
        chatId: 'ВАШ_CHAT_ID' 
    },

    storage: {
        cartKey: 'fto_cart_v3',
        userKey: 'fto_user_data'
    }
};