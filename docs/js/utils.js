/**
 * docs/js/utils.js
 * Вспомогательные функции
 */

const Utils = {
    formatPrice(price) {
        return new Intl.NumberFormat('ru-RU').format(price) + ' ' + APP_CONFIG.app.currency;
    },

    // Генерация пути к изображению по ID товара (например, "1.1" -> "images/1.1.jpg")
    getProductImage(id) {
        // Пробуем найти jpg, если нет - png, иначе заглушка
        // В реальном проекте лучше иметь единый формат, допустим .jpg
        return `${APP_CONFIG.paths.imagesBase}${id}.jpg`; 
    },

    isValidPhone(phone) {
        return /^[\d\+\-\(\)\s]{10,20}$/.test(phone);
    },

    sanitize(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
};