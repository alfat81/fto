// Инициализация корзины (вынесена в отдельный файл для переиспользования)
let cart = JSON.parse(localStorage.getItem('cart')) || [];
const API_URL = 'https://fto-tdks.onrender.com/api/order';

// Функции корзины (обновленная версия из предыдущего сообщения)
function updateCartDisplay() {
    // ... (код из предыдущего сообщения)
}

function removeFromCart(index) {
    // ... (код из предыдущего сообщения)
}

function addToCart(product) {
    // ... (код из предыдущего сообщения)
}

// ... остальные функции корзины

// Инициализация корзины при загрузке
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('cart-modal') || document.querySelector('.add-to-cart')) {
        updateCartDisplay();
        initAddToCartButtons();
        setupCartModal();
    }
});
