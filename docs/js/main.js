// Инициализация корзины
let cart = JSON.parse(localStorage.getItem('cart')) || [];
const API_URL = 'https://fto-tdks.onrender.com/api/order'; // УБРАЛ ЛИШНИЕ ПРОБЕЛЫ В КОНЦЕ

// Обновление отображения корзины
function updateCartDisplay() {
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = cart.length;
    }
    
    const cartItemsContainer = document.getElementById('cart-items');
    if (!cartItemsContainer) return;
    
    cartItemsContainer.innerHTML = '';
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart">Ваша корзина пуста</p>';
        const cartTotalElement = document.getElementById('cart-total');
        const checkoutBtn = document.getElementById('checkout-btn');
        if (cartTotalElement) cartTotalElement.textContent = '0 ₽';
        if (checkoutBtn) checkoutBtn.disabled = true;
        return;
    }
    
    let total = 0;
    cart.forEach((item, index) => {
        total += item.price;
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        itemElement.innerHTML = `
            <div class="cart-item-info">
                <strong>${item.name}</strong>
                <div class="cart-item-price">${item.price.toLocaleString('ru-RU')} ₽</div>
            </div>
            <button class="remove-item" data-index="${index}">
                <i class="fas fa-trash"></i>
            </button>
        `;
        cartItemsContainer.appendChild(itemElement);
    });
    
    const cartTotalElement = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');
    if (cartTotalElement) cartTotalElement.textContent = `${total.toLocaleString('ru-RU')} ₽`;
    if (checkoutBtn) checkoutBtn.disabled = false;
    
    // Обработчики удаления
    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            removeFromCart(index);
        });
    });
}

// Удаление товара из корзины
function removeFromCart(index) {
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
    showToast('Товар удален из корзины');
}

// Добавление товара в корзину
function addToCart(product) {
    cart.push(product);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
    
    showToast('Товар добавлен в корзину!', 'success');
    
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
            throw new Error(errorData.message || 'Ошибка при отправке заказа');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Ошибка при отправке заказа:', error);
        throw error;
    }
}

// Оформление заказа
const checkoutForm = document.getElementById('checkout-form');
if (checkoutForm) {
    checkoutForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (cart.length === 0) {
            showToast('Корзина пуста!', 'error');
            return;
        }
        
        const phone = document.getElementById('phone')?.value.trim() || '';
        const name = document.getElementById('name')?.value.trim() || '';
        const comment = document.getElementById('comment')?.value.trim() || '';
        
        // Валидация телефона
        if (!phone || !/^\+?7[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}$/.test(phone.replace(/\D/g, ''))) {
            showToast('Пожалуйста, введите корректный номер телефона', 'error');
            return;
        }
        
        // Валидация имени
        if (!name || name.length < 2) {
            showToast('Пожалуйста, введите ваше имя', 'error');
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
            // Показать индикатор загрузки
            checkoutBtn.disabled = true;
            checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
        }
        
        try {
            const result = await sendOrderToServer(order);
            
            // Очистка корзины после успешного заказа
            cart = [];
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartDisplay();
            
            // Очистка формы
            if (checkoutForm) checkoutForm.reset();
            
            // Закрытие модального окна
            const cartModal = document.getElementById('cart-modal');
            if (cartModal) cartModal.style.display = 'none';
            
            // Показать сообщение об успехе
            showToast('✅ Заказ успешно отправлен!\nМенеджер свяжется с вами в ближайшее время.', 'success', 5000);
            
        } catch (error) {
            showToast(`❌ Ошибка при отправке заказа: ${error.message}`, 'error', 5000);
        } finally {
            // Восстановить кнопку
            if (checkoutBtn) {
                checkoutBtn.disabled = false;
                checkoutBtn.innerHTML = 'Оформить заказ';
            }
        }
    });
}

// Вспомогательная функция расчета итога
function calculateTotal(items) {
    return items.reduce((sum, item) => sum + item.price, 0);
}

// Показать уведомление
function showToast(message, type = 'info', duration = 3000) {
    // Создать контейнер для тостов, если его нет
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 350px;
        `;
        document.body.appendChild(toastContainer);
    }
    
    // Создать тост
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        margin-bottom: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s, fadeOut 0.5s ${duration}ms forwards;
        max-width: 100%;
        word-wrap: break-word;
    `;
    toast.innerHTML = message;
    
    // Добавить в контейнер
    toastContainer.appendChild(toast);
    
    // Удалить после анимации
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.5s forwards';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 500);
    }, duration);
}

// Обработчики для модального окна
const cartBtn = document.getElementById('cart-btn');
if (cartBtn) {
    cartBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const cartModal = document.getElementById('cart-modal');
        if (cartModal) {
            cartModal.style.display = 'flex';
            updateCartDisplay();
        }
    });
}

const closeBtn = document.querySelector('.close');
if (closeBtn) {
    closeBtn.addEventListener('click', function() {
        const cartModal = document.getElementById('cart-modal');
        if (cartModal) cartModal.style.display = 'none';
    });
}

window.addEventListener('click', function(e) {
    const cartModal = document.getElementById('cart-modal');
    if (cartModal && e.target === cartModal) {
        cartModal.style.display = 'none';
    }
});

// Закрытие модального окна по нажатию Esc
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const cartModal = document.getElementById('cart-modal');
        if (cartModal) cartModal.style.display = 'none';
    }
});

// Функция инициализации кнопок добавления в корзину
function initAddToCartButtons() {
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function() {
            const product = {
                id: this.getAttribute('data-id'),
                name: this.getAttribute('data-name'),
                price: parseInt(this.getAttribute('data-price')) || 0,
                image: this.getAttribute('data-image') || ''
            };
            addToCart(product);
        });
    });
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    updateCartDisplay();
    initAddToCartButtons();
    
    // Добавить обработчик для динамически добавляемых кнопок
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('add-to-cart')) {
            const product = {
                id: e.target.getAttribute('data-id'),
                name: e.target.getAttribute('data-name'),
                price: parseInt(e.target.getAttribute('data-price')) || 0,
                image: e.target.getAttribute('data-image') || ''
            };
            addToCart(product);
        }
    });
    
    // Плавная прокрутка
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
    
    // Эффект при прокрутке для хедера
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
    
    // Анимация появления элементов при прокрутке
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
    
    // Проверка при прокрутке
    window.addEventListener('scroll', checkScroll);
    checkScroll(); // Проверить сразу при загрузке
});

console.log('Корзина успешно инициализирована. API URL:', API_URL);
