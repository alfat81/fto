/**
 * toast-module.js
 * Модуль для отображения всплывающих уведомлений.
 * Зависит от базовых стилей (должны быть в CSS).
 */

const ToastModule = (function() {
    let container = null;

    /**
     * Инициализация контейнера для тостов
     */
    function init() {
        if (!document.getElementById('toast-container')) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 10px;
            `;
            document.body.appendChild(container);
        } else {
            container = document.getElementById('toast-container');
        }
    }

    /**
     * Создание и отображение уведомления
     * @param {string} message - Текст сообщения
     * @param {string} type - Тип: 'success', 'error', 'warning', 'info'
     * @param {number} duration - Время показа в мс
     */
    function show(message, type = 'info', duration = 3000) {
        if (!container) init();

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        // Базовые стили для тоста (можно вынести в CSS)
        toast.style.cssText = `
            min-width: 250px;
            padding: 15px 20px;
            background: #fff;
            color: #333;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            justify-content: space-between;
            animation: slideIn 0.3s ease-out forwards;
            border-left: 5px solid ${getColor(type)};
            font-family: sans-serif;
            font-size: 14px;
        `;

        const icon = getIcon(type);
        
        toast.innerHTML = `
            <span style="display:flex; align-items:center; gap:10px;">
                ${icon} <strong>${message}</strong>
            </span>
        `;

        container.appendChild(toast);

        // Анимация удаления
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-in forwards';
            toast.addEventListener('animationend', () => {
                toast.remove();
                if (container.children.length === 0) {
                    // Опционально: удалять контейнер, если пуст
                    // container.remove(); 
                }
            });
        }, duration);
    }

    function getColor(type) {
        switch(type) {
            case 'success': return '#28a745';
            case 'error': return '#dc3545';
            case 'warning': return '#ffc107';
            default: return '#17a2b8';
        }
    }

    function getIcon(type) {
        switch(type) {
            case 'success': return '✅';
            case 'error': return '❌';
            case 'warning': return '⚠️';
            default: return 'ℹ️';
        }
    }

    // Публичные методы
    return {
        success: (msg, dur) => show(msg, 'success', dur),
        error: (msg, dur) => show(msg, 'error', dur),
        warning: (msg, dur) => show(msg, 'warning', dur),
        info: (msg, dur) => show(msg, 'info', dur),
        init: init
    };
})();

// Добавляем ключевые кадры анимации в документ динамически
if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}