/**
 * utils.js
 * Набор вспомогательных утилит для проекта.
 * Не зависит от других модулей, кроме config.js.
 */

const Utils = {
    /**
     * Форматирует число в валюту (рубли)
     * @param {number} amount - Сумма
     * @returns {string} Отформатированная строка (например, "1 200 ₽")
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat(APP_CONFIG.app.locale, {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 0
        }).format(amount);
    },

    /**
     * Генерирует уникальный идентификатор
     * @returns {string} UUID-like строка
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * Простая валидация email
     * @param {string} email 
     * @returns {boolean}
     */
    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    },

    /**
     * Валидация телефона (базовая проверка на наличие цифр)
     * @param {string} phone 
     * @returns {boolean}
     */
    isValidPhone(phone) {
        const re = /^[\d\+\-\(\)\s]{7,20}$/;
        return re.test(phone);
    },

    /**
     * Очищает строку от лишних пробелов и тегов
     * @param {string} str 
     * @returns {string}
     */
    sanitizeInput(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML.trim();
    },

    /**
     * Задержка выполнения (для анимаций или дебаунса)
     * @param {number} ms 
     * @returns {Promise}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Сохранение данных в localStorage с обработкой ошибок
     * @param {string} key 
     * @param {any} data 
     */
    saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error('Ошибка сохранения в localStorage:', e);
        }
    },

    /**
     * Чтение данных из localStorage
     * @param {string} key 
     * @returns {any|null}
     */
    getFromStorage(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error('Ошибка чтения из localStorage:', e);
            return null;
        }
    }
};