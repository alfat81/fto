// Полностью переписанный файл main.js без ошибок

// Инициализация корзины
let cart = JSON.parse(localStorage.getItem('cart')) || [];
const API_URL = 'https://fto-tdks.onrender.com/api/order';

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
        
        const itemPrice = document.createElement('div');
        itemPrice.className = 'cart-item-price';
        itemPrice.textContent = `${item.price.toLocaleString('ru-RU')} ₽`;
        
        const removeButton = document.createElement('button');
        removeButton.className = 'remove-item';
        removeButton.setAttribute('data-index', index);
        removeButton.innerHTML = '<i class="fas fa-trash"></i>';
        
        itemInfo.appendChild(itemName);
        itemInfo.appendChild(itemPrice);
        itemElement.appendChild(itemInfo);
        itemElement.appendChild(removeButton);
        cartItemsContainer.appendChild(itemElement);
    });
    
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
    if (index < 0 || index >= cart.length) return;
    
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
}

// Добавление товара в корзину
function addToCart(product) {
    cart.push(product);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
    
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
            throw new Error(errorData.message || `Ошибка ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Ошибка при отправке заказа:', error);
        throw error;
    }
}

// Обработка отправки заказа
async function handleOrderSubmission(e) {
    e.preventDefault();
    
    if (cart.length === 0) {
        alert('Корзина пуста!');
        return;
    }
    
    const phone = document.getElementById('phone').value.trim();
    const name = document.getElementById('name').value.trim();
    const comment = document.getElementById('comment').value.trim();
    
    // Валидация телефона
    if (!phone || !/^\+?7[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}$/.test(phone.replace(/\D/g, ''))) {
        alert('Пожалуйста, введите корректный номер телефона');
        return;
    }
    
    // Валидация имени
    if (!name || name.length < 2) {
        alert('Пожалуйста, введите ваше имя');
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
        checkoutBtn.innerHTML = 'Отправка...';
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
        
        alert('Заказ успешно отправлен! Менеджер свяжется с вами в ближайшее время.');
        
    } catch (error) {
        alert(`Ошибка при отправке заказа: ${error.message}\nПопробуйте снова или позвоните по телефону +7 (960) 178-67-38`);
    } finally {
        if (checkoutBtn) {
            checkoutBtn.disabled = false;
            checkoutBtn.innerHTML = 'Оформить заказ';
        }
    }
}

// Расчет общей суммы
function calculateTotal(items) {
    return items.reduce((sum, item) => sum + item.price, 0);
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Кнопка корзины
    const cartBtn = document.getElementById('cart-btn');
    if (cartBtn) {
        cartBtn.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('cart-modal').style.display = 'flex';
            updateCartDisplay();
        });
    }
    
    // Закрытие модального окна
    document.querySelector('.close')?.addEventListener('click', function() {
        document.getElementById('cart-modal').style.display = 'none';
    });
    
    // Закрытие по клику вне модального окна
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('cart-modal');
        if (modal && e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Оформление заказа
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleOrderSubmission);
    }
    
    // Добавление товаров в корзину
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const product = {
                id: this.getAttribute('data-id') || 'product-' + Date.now(),
                name: this.getAttribute('data-name') || 'Без названия',
                price: parseInt(this.getAttribute('data-price')) || 0
            };
            
            addToCart(product);
        });
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
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    cart = JSON.parse(localStorage.getItem('cart')) || [];
    setupEventListeners();
    updateCartDisplay();
});
