const Utils = {
    formatPrice(p) { return new Intl.NumberFormat('ru-RU').format(p) + ' ₽'; },
    sanitize(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
};
