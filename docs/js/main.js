// Инициализация корзины
let cart = JSON.parse(localStorage.getItem('cart')) || [];
const API_URL = 'https://fto-tdks.onrender.com/api/order';

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Сайт успешно загружен');
    
    // Инициализация всех компонентов
    initCart();
    initNavigation();
    initSearch();
    initProductCards();
    initSlider();
    setupModal();
    setupFormValidation();
    
    // Обновление счетчика корзины
    updateCartCount();
});

// Инициализация корзины
function initCart() {
    console.log('🛒 Инициализация корзины');
    
    // Добавление товаров в корзину
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const product = {
                id: this.dataset.id,
                name: this.dataset.name,
                price: parseInt(this.dataset.price),
                quantity: 1
            };
            addToCart(product);
        });
    });
}

// Добавление товара в корзину
function addToCart(product) {
    console.log('➕ Добавление товара в корзину:', product);
    
    // Проверка наличия товара в корзине
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
        existingItem.quantity += 1;
        showToast('Товар добавлен в корзину', 'success');
    } else {
        cart.push(product);
        showToast('Товар добавлен в корзину', 'success');
    }
    
    // Сохранение в localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Обновление интерфейса
    updateCartCount();
    openCartModal();
}

// Обновление счетчика корзины
function updateCartCount() {
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    }
}

// Открытие модального окна корзины
function openCartModal() {
    const modal = document.getElementById('cart-modal');
    if (modal) {
        modal.style.display = 'flex';
        updateCartDisplay();
    }
}

// Закрытие модального окна корзины
function closeCartModal() {
    const modal = document.getElementById('cart-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Обновление отображения корзины
function updateCartDisplay() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');
    
    if (!cartItemsContainer || !cartTotalElement || !checkoutBtn) return;
    
    // Очистка контейнера
    cartItemsContainer.innerHTML = '';
    
    // Отображение товаров
    let total = 0;
    cart.forEach((item, index) => {
        total += item.price * item.quantity;
        
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        itemElement.innerHTML = `
            <div class="cart-item-info">
                <strong>${item.name}</strong>
                <div class="cart-item-price">${(item.price * item.quantity).toLocaleString('ru-RU')} ₽</div>
            </div>
            <button class="remove-item" data-index="${index}">
                <i class="fas fa-times"></i>
            </button>
        `;
        cartItemsContainer.appendChild(itemElement);
    });
    
    // Обновление общей суммы
    cartTotalElement.textContent = `${total.toLocaleString('ru-RU')} ₽`;
    
    // Обновление кнопки оформления заказа
    checkoutBtn.disabled = cart.length === 0;
    
    // Добавление обработчиков удаления
    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            removeFromCart(index);
        });
    });
}

// Удаление товара из корзины
function removeFromCart(index) {
    if (index < 0 || index >= cart.length) return;
    
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    updateCartDisplay();
    showToast('Товар удален из корзины', 'info');
}

// Очистка корзины
function clearCart() {
    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    updateCartDisplay();
}

// Инициализация навигации
function initNavigation() {
    console.log('🔧 Инициализация навигации');
    
    // Мобильное меню
    const menuToggle = document.querySelector('.menu-toggle');
    const menu = document.querySelector('.menu');
    
    if (menuToggle && menu) {
        menuToggle.addEventListener('click', function() {
            menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
        });
    }
    
    // Закрытие меню при клике вне его
    document.addEventListener('click', function(e) {
        if (menu.style.display === 'flex' && 
            !e.target.closest('.menu') && 
            !e.target.closest('.menu-toggle')) {
            menu.style.display = 'none';
        }
    });
}

// Инициализация поиска
function initSearch() {
    console.log('🔍 Инициализация поиска');
    
    const searchBtn = document.querySelector('.search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            showToast('Функция поиска будет доступна в следующей версии', 'info');
        });
    }
}

// Инициализация карточек товаров
function initProductCards() {
    console.log('📦 Инициализация карточек товаров');
    
    // Эффекты при наведении
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

// Инициализация слайдера
function initSlider() {
    console.log('🖼️ Инициализация слайдера');
    
    // Простая автоматическая смена слайдов
    const slides = document.querySelectorAll('.banner-item');
    let currentSlide = 0;
    
    function nextSlide() {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }
    
    // Запуск слайдера с интервалом 5 секунд
    setInterval(nextSlide, 5000);
}

// Настройка модального окна
function setupModal() {
    console.log('_modal️ Настройка модального окна');
    
    const modal = document.getElementById('cart-modal');
    const closeBtn = document.querySelector('.close');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeCartModal);
    }
    
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeCartModal();
            }
        });
    }
    
    // Закрытие по клавише Esc
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            closeCartModal();
        }
    });
}

// Показать уведомление
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.animation = 'slideIn 0.3s, fadeOut 0.5s 3000ms forwards';
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i> ${message}`;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 3000);
}

// Создание контейнера для уведомлений
function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.style.position = 'fixed';
    container.style.top = '20px';
    container.style.right = '20px';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    return container;
}

// Настройка валидации формы
function setupFormValidation() {
    console.log('✅ Настройка валидации формы');
    
    const form = document.getElementById('checkout-form');
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const name = document.getElementById('name').value.trim();
        const phone = document.getElementById('phone').value.trim();
        
        // Валидация данных
        if (!name || name.length < 2) {
            showToast('Пожалуйста, введите ваше имя', 'error');
            return;
        }
        
        if (!phone || !/^\+?7[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}$/.test(phone.replace(/\D/g, ''))) {
            showToast('Пожалуйста, введите корректный номер телефона', 'error');
            return;
        }
        
        // Отправка заказа
        await sendOrder({
            items: cart,
            customer: {
                name: name,
                phone: phone,
                comment: document.getElementById('comment').value.trim()
            },
            total: calculateTotal()
        });
    });
}

// Расчет общей суммы
function calculateTotal() {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// Отправка заказа на сервер
async function sendOrder(orderData) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });
        
        if (!response.ok) {
            throw new Error('Ошибка при отправке заказа');
        }
        
        const result = await response.json();
        console.log('✅ Заказ успешно отправлен:', result);
        
        // Очистка корзины
        clearCart();
        
        // Показать уведомление
        showToast('Ваш заказ успешно отправлен! Менеджер свяжется с вами в ближайшее время.', 'success');
        
        // Закрытие модального окна
        closeCartModal();
        
    } catch (error) {
        console.error('❌ Ошибка при отправке заказа:', error);
        showToast('Ошибка при отправке заказа. Пожалуйста, попробуйте снова или позвоните по телефону.', 'error');
    }
}
