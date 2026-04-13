const Utils = {
    formatCurrency: (amount) => {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 0
        }).format(amount);
    },

    generateId: () => Date.now().toString(36) + Math.random().toString(36).substr(2),

    isValidPhone: (phone) => /^[\d\+\-\(\)\s]{7,20}$/.test(phone),
    
    isValidEmail: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase()),

    saveToStorage: (key, data) => {
        try { localStorage.setItem(key, JSON.stringify(data)); } catch(e) {}
    },

    getFromStorage: (key) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch(e) { return null; }
    }
};