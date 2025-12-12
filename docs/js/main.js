// Инициализация корзины при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM полностью загружен');
    
    // Инициализация корзины
    if (typeof window.cart !== 'undefined') {
        window.cart = JSON.parse(localStorage.getItem('cart')) || [];
        console.log('🛒 Загружена корзина из localStorage:', window.cart);
    }
    
    // Инициализация кнопок корзины
    if (document.querySelector('.add-to-cart')) {
        initAddToCartButtons();
    }
    
    console.log('🎉 Инициализация скрипта завершена успешно');
});

// Функция инициализации кнопок добавления в корзину
function initAddToCartButtons() {
    console.log('🔧 Инициализация кнопок добавления в корзину');
    
    // Удаляем все существующие обработчики со всех кнопок
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.removeEventListener('click', addToCartHandler);
        button.addEventListener('click', addToCartHandler);
    });
}

// Обработчик клика по кнопке "В корзину"
function addToCartHandler(e) {
    e.stopPropagation();
    e.preventDefault();
    
    console.log('🛒 Клик по кнопке "В корзину"');
    console.log('🎯 Целевая кнопка:', this);
    
    const product = {
        id: this.getAttribute('data-id') || 'product-' + Date.now(),
        name: this.getAttribute('data-name') || 'Без названия',
        price: parseInt(this.getAttribute('data-price')) || 0,
        image: this.getAttribute('data-image') || ''
    };
    
    console.log('📦 Создан объект товара:', product);
    addToCart(product);
}

// Функция добавления товара в корзину
function addToCart(product) {
    console.log('➕ Добавление товара в корзину:', product);
    
    if (!window.cart) {
        window.cart = JSON.parse(localStorage.getItem('cart')) || [];
    }
    
    window.cart.push(product);
    localStorage.setItem('cart', JSON.stringify(window.cart));
    console.log('💾 Корзина сохранена в localStorage');
    console.log('🛒 Корзина после добавления:', window.cart);
    
    // Обновление отображения корзины, если функция доступна
    if (typeof updateCartDisplay === 'function') {
        updateCartDisplay();
    }
    
    showToast(`✅ "${product.name}" добавлен в корзину!`, 'success', 3000);
    
    // Анимация кнопки корзины
    const cartBtn = document.getElementById('cart-btn');
    if (cartBtn) {
        cartBtn.style.transform = 'scale(1.2)';
        setTimeout(() => {
            cartBtn.style.transform = 'scale(1)';
        }, 300);
    }
}

// Функция показа уведомления
function showToast(message, type = 'info', duration = 3000) {
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.position = 'fixed';
        toastContainer.style.top = '20px';
        toastContainer.style.right = '20px';
        toastContainer.style.zIndex = '9999';
        toastContainer.style.maxWidth = '350px';
        document.body.appendChild(toastContainer);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const backgroundColor = type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8';
    toast.style.background = backgroundColor;
    toast.style.color = 'white';
    toast.style.padding = '15px 20px';
    toast.style.borderRadius = '8px';
    toast.style.marginBottom = '10px';
    toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    toast.style.animation = `slideIn 0.3s, fadeOut 0.5s ${duration}ms forwards`;
    toast.style.maxWidth = '100%';
    toast.style.wordWrap = 'break-word';
    toast.style.fontFamily = 'Arial, sans-serif';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    
    const icon = document.createElement('i');
    icon.className = type === 'success' ? 'fas fa-check-circle' : type === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-info-circle';
    icon.style.marginRight = '10px';
    icon.style.fontSize = '1.2em';
    
    const text = document.createElement('span');
    text.textContent = message;
    
    toast.appendChild(icon);
    toast.appendChild(text);
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.5s forwards';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 500);
    }, duration);
}
