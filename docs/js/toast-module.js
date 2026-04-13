const ToastModule = (function() {
    let container = null;

    function init() {
        if (!document.getElementById('toast-container')) {
            container = document.createElement('div');
            container.id = 'toast-container';
            // Базовые стили позиционирования, чтобы не лезть в style.css
            Object.assign(container.style, {
                position: 'fixed', top: '20px', right: '20px', zIndex: '9999',
                display: 'flex', flexDirection: 'column', gap: '10px'
            });
            document.body.appendChild(container);
        } else {
            container = document.getElementById('toast-container');
        }
    }

    function show(message, type = 'info') {
        if (!container) init();
        const toast = document.createElement('div');
        
        // Цвета в зависимости от типа
        const colors = { success: '#28a745', error: '#dc3545', warning: '#ffc107', info: '#17a2b8' };
        const color = colors[type] || colors.info;

        Object.assign(toast.style, {
            minWidth: '250px', padding: '12px 20px', background: '#fff', color: '#333',
            borderRadius: '4px', boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            borderLeft: `4px solid ${color}`, fontFamily: 'sans-serif', fontSize: '14px',
            animation: 'slideIn 0.3s ease-out'
        });

        toast.innerHTML = `<strong>${message}</strong>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Добавляем анимацию один раз
    if (!document.getElementById('toast-anim')) {
        const s = document.createElement('style');
        s.id = 'toast-anim';
        s.textContent = `@keyframes slideIn { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }`;
        document.head.appendChild(s);
    }

    return {
        success: (msg) => show(msg, 'success'),
        error: (msg) => show(msg, 'error'),
        warning: (msg) => show(msg, 'warning'),
        info: (msg) => show(msg, 'info')
    };
})();