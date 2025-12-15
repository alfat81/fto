// Глобальные переменные
let cart = JSON.parse(localStorage.getItem('cart')) || [];
const API_URL = 'https://fto-tdks.onrender.com/api/order';

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Сайт загружен. Корзина инициализирована');
    
    // Инициализация компонентов
    initCart();
    initHeader();
    initNavigation();
    initParallaxEffects();
    initAddToCartButtons();
    
    // Обновление отображения корзины
    updateCartDisplay();
    
    // Настройка модального окна корзины
    setupCartModal();
    
    console.log('🎉 Инициализация завершена');
});

// Инициализация корзины
function initCart() {
    console.log('🛒 Инициализация корзины');
    
    // Обновление счетчика товаров
    updateCartCount();
    
    // Настройка формы оформления заказа
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleOrderSubmission);
    }
    
    console.log('✅ Корзина инициализирована');
}

// Обновление отображения корзины
function updateCartDisplay() {
    const cartCountElement = document.getElementById('cart-count');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');
    
    if (cartCountElement) {
        cartCountElement.textContent = cart.length;
    }
    
    if (!cartItemsContainer) return;
    
    cartItemsContainer.innerHTML = '';
    
    if (cart.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'empty-cart';
        emptyMessage.textContent = 'Ваша корзина пуста';
        emptyMessage.style.textAlign = 'center';
        emptyMessage.style.padding = '20px';
        emptyMessage.style.color = '#7f8c8d';
        emptyMessage.style.fontStyle = 'italic';
        cartItemsContainer.appendChild(emptyMessage);
        
        if (cartTotalElement) cartTotalElement.textContent = '0 ₽';
        if (checkoutBtn) checkoutBtn.disabled = true;
        return;
    }
    
    let total = 0;
    cart.forEach((item, index) => {
        total += item.price;
        
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        
        const itemInfo = document.createElement('div');
        itemInfo.className = 'cart-item-info';
        
        const itemName = document.createElement('strong');
        itemName.textContent = item.name;
        itemInfo.appendChild(itemName);
        
        const itemPrice = document.createElement('div');
        itemPrice.className = 'cart-item-price';
        itemPrice.textContent = `${item.price.toLocaleString('ru-RU')} ₽`;
        itemInfo.appendChild(itemPrice);
        
        const removeButton = document.createElement('button');
        removeButton.className = 'remove-item';
        removeButton.setAttribute('data-index', index);
        removeButton.innerHTML = '<i class="fas fa-trash"></i>';
        
        itemElement.appendChild(itemInfo);
        itemElement.appendChild(removeButton);
        cartItemsContainer.appendChild(itemElement);
    });
    
    if (cartTotalElement) cartTotalElement.textContent = `${total.toLocaleString('ru-RU')} ₽`;
    if (checkoutBtn) checkoutBtn.disabled = false;
    
    // Обработчики удаления
    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            removeFromCart(index);
        });
    });
}

// Удаление товара из корзины
function removeFromCart(index) {
    if (index < 0 || index >= cart.length) return;
    
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
    showToast('Товар удален из корзины', 'success');
}

// Добавление товара в корзину
function addToCart(product) {
    cart.push(product);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
    
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

// Отправка заказа на сервер
async function sendOrderToServer(orderData) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Ошибка ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('❌ Ошибка при отправке заказа:', error);
        throw error;
    }
}

// Оформление заказа
async function handleOrderSubmission(e) {
    e.preventDefault();
    
    if (cart.length === 0) {
        showToast('Корзина пуста! Добавьте товары для оформления заказа.', 'error');
        return;
    }
    
    const phone = document.getElementById('phone').value.trim();
    const name = document.getElementById('name').value.trim();
    const comment = document.getElementById('comment') ? document.getElementById('comment').value.trim() : '';
    
    // Валидация данных
    if (!phone || !/^\+?7[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}$/.test(phone.replace(/\D/g, ''))) {
        showToast('Пожалуйста, введите корректный номер телефона в формате +7 (999) 123-45-67', 'error');
        return;
    }
    
    if (!name || name.length < 2) {
        showToast('Пожалуйста, введите ваше имя (минимум 2 символа)', 'error');
        return;
    }
    
    const order = {
        items: cart,
        customer: {
            name: name,
            phone: phone,
            comment: comment
        },
        total: calculateTotal(cart),
        date: new Date().toISOString()
    };
    
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.disabled = true;
        checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
    }
    
    try {
        await sendOrderToServer(order);
        
        // Очистка корзины после успешного заказа
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartDisplay();
        
        // Очистка формы
        document.getElementById('checkout-form').reset();
        
        // Закрытие модального окна
        document.getElementById('cart-modal').style.display = 'none';
        
        // Показать сообщение об успехе
        showToast('✅ Заказ успешно отправлен!\nМенеджер свяжется с вами в ближайшее время.', 'success', 5000);
        
    } catch (error) {
        showToast(`❌ Ошибка при отправке заказа: ${error.message}\nПопробуйте снова или позвоните по телефону +7 (960) 178-67-38`, 'error', 7000);
    } finally {
        if (checkoutBtn) {
            checkoutBtn.disabled = false;
            checkoutBtn.innerHTML = 'Оформить заказ';
        }
    }
}

// Вспомогательные функции
function calculateTotal(items) {
    return items.reduce((sum, item) => sum + item.price, 0);
}

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
    toast.innerHTML = message;
    
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

// Инициализация кнопок добавления в корзину
function initAddToCartButtons() {
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const product = {
                id: this.getAttribute('data-id') || 'product-' + Date.now(),
                name: this.getAttribute('data-name') || 'Без названия',
                price: parseInt(this.getAttribute('data-price')) || 0,
                image: this.getAttribute('data-image') || ''
            };
            
            addToCart(product);
        });
    });
}

// Настройка модального окна корзины
function setupCartModal() {
    const cartBtn = document.getElementById('cart-btn');
    const cartModal = document.getElementById('cart-modal');
    const closeBtn = document.querySelector('.close');
    
    if (cartBtn) {
        cartBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (cartModal) {
                cartModal.style.display = 'flex';
                updateCartDisplay();
            }
        });
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            if (cartModal) cartModal.style.display = 'none';
        });
    }
    
    if (cartModal) {
        window.addEventListener('click', function(e) {
            if (e.target === cartModal) {
                cartModal.style.display = 'none';
            }
        });
        
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && cartModal.style.display === 'flex') {
                cartModal.style.display = 'none';
            }
        });
    }
}

// Инициализация навигации
function initNavigation() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Обработка прокрутки для хедера
    window.addEventListener('scroll', function() {
        const header = document.querySelector('header');
        if (header) {
            if (window.scrollY > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
    });
}

// Параллакс эффекты
function initParallaxEffects() {
    const parallaxItems = document.querySelectorAll('.parallax-item');
    
    function checkScroll() {
        parallaxItems.forEach(item => {
            const itemPosition = item.getBoundingClientRect().top;
            const screenPosition = window.innerHeight / 1.3;
            
            if (itemPosition < screenPosition) {
                item.classList.add('visible');
            }
        });
    }
    
    window.addEventListener('scroll', checkScroll);
    checkScroll(); // Проверить при загрузке
}

console.log('✅ main.js успешно загружен и инициализирован');
