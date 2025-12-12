// Инициализация корзины
let cart = JSON.parse(localStorage.getItem('cart')) || [];
const API_URL = 'https://fto-tdks.onrender.com/api/order';

console.log('🚀 Сайт загружен. Версия скрипта: 2.1.0');
console.log('🛒 Начальное состояние корзины:', cart);

// Обновление отображения корзины
function updateCartDisplay() {
    console.log('🔄 Обновление отображения корзины');
    
    const cartCountElement = document.getElementById('cart-count');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');
    
    // Проверка существования элементов
    if (cartCountElement) {
        cartCountElement.textContent = cart.length;
        console.log('🔢 Обновлено количество товаров в корзине:', cart.length);
    } else {
        console.warn('⚠️ Элемент cart-count не найден в DOM');
    }
    
    if (!cartItemsContainer) {
        console.warn('⚠️ Элемент cart-items не найден в DOM');
        return;
    }
    
    // Очистка контейнера перед добавлением товаров
    cartItemsContainer.innerHTML = '';
    
    // Отображение пустой корзины
    if (cart.length === 0) {
        console.log('🛒 Корзина пуста');
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'empty-cart';
        emptyMessage.textContent = 'Ваша корзина пуста';
        emptyMessage.style.textAlign = 'center';
        emptyMessage.style.padding = '20px';
        emptyMessage.style.color = '#7f8c8d';
        emptyMessage.style.fontStyle = 'italic';
        emptyMessage.style.fontSize = '1.2rem';
        cartItemsContainer.appendChild(emptyMessage);
        
        if (cartTotalElement) cartTotalElement.textContent = '0 ₽';
        if (checkoutBtn) checkoutBtn.disabled = true;
        return;
    }
    
    // Отображение товаров в корзине
    let total = 0;
    cart.forEach((item, index) => {
        total += item.price;
        console.log(`📦 Товар ${index + 1}:`, item);
        
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
    
    console.log('💰 Общая сумма:', total.toLocaleString('ru-RU'), '₽');
    
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
    console.log(`🧹 Удаление товара по индексу ${index} из корзины`);
    
    if (index < 0 || index >= cart.length) {
        console.error(`❌ Неверный индекс для удаления: ${index}`);
        return;
    }
    
    const removedItem = cart[index];
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    console.log('💾 Корзина сохранена в localStorage');
    console.log('🛒 Корзина после удаления:', cart);
    
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
document.getElementById('checkout-form')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (cart.length === 0) {
        showToast('Корзина пуста!', 'error');
        return;
    }
    
    const phone = document.getElementById('phone').value.trim();
    const name = document.getElementById('name').value.trim();
    const comment = document.getElementById('comment').value.trim();
    
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
    
    // Показать индикатор загрузки
    document.getElementById('checkout-btn').disabled = true;
    document.getElementById('checkout-btn').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
    
    try {
        const result = await sendOrderToServer(order);
        
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
        showToast(`❌ Ошибка при отправке заказа: ${error.message}`, 'error', 5000);
    } finally {
        // Восстановить кнопку
        document.getElementById('checkout-btn').disabled = false;
        document.getElementById('checkout-btn').innerHTML = 'Оформить заказ';
    }
});

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
        toastContainer.style.position = 'fixed';
        toastContainer.style.top = '20px';
        toastContainer.style.right = '20px';
        toastContainer.style.zIndex = '9999';
        toastContainer.style.maxWidth = '350px';
        document.body.appendChild(toastContainer);
    }
    
    // Создать тост
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.padding = '15px 20px';
    toast.style.borderRadius = '8px';
    toast.style.marginBottom = '10px';
    toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    toast.style.color = 'white';
    toast.style.maxWidth = '100%';
    toast.style.wordWrap = 'break-word';
    toast.style.animation = `slideIn 0.3s, fadeOut 0.5s ${duration}ms forwards`;
    
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
document.getElementById('cart-btn')?.addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('cart-modal').style.display = 'flex';
    updateCartDisplay();
});

document.querySelector('.close')?.addEventListener('click', function() {
    document.getElementById('cart-modal').style.display = 'none';
});

window.addEventListener('click', function(e) {
    const modal = document.getElementById('cart-modal');
    if (modal && e.target === modal) {
        modal.style.display = 'none';
    }
});

// Закрытие модального окна по нажатию Esc
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        document.getElementById('cart-modal')?.style.display = 'none';
    }
});

// Функция инициализации кнопок добавления в корзину
function initAddToCartButtons() {
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function() {
            const product = {
                id: this.getAttribute('data-id'),
                name: this.getAttribute('data-name'),
                price: parseInt(this.getAttribute('data-price')),
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
                price: parseInt(e.target.getAttribute('data-price')),
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
        if (window.scrollY > 100 && header) {
            header.classList.add('scrolled');
        } else if (header) {
            header.classList.remove('scrolled');
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
    
    // Проверка при загрузке страницы
    window.addEventListener('load', function() {
        setTimeout(() => {
            document.querySelector('.hero-content').style.opacity = '1';
            document.querySelector('.hero-content').style.transform = 'translateY(0)';
        }, 300);
        
        checkScroll();
    });
});

console.log('✅ Скрипт успешно инициализирован');
