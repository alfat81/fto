// Инициализация корзины
let cart = JSON.parse(localStorage.getItem('cart')) || [];
const API_URL = 'https://fto-tdks.onrender.com/api/order';

console.log('🚀 Сайт загружен. Версия скрипта: 2.2.0');
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
        itemElement.style.display = 'flex';
        itemElement.style.justifyContent = 'space-between';
        itemElement.style.alignItems = 'center';
        itemElement.style.padding = '10px 0';
        itemElement.style.borderBottom = '1px solid #eee';
        
        // Информация о товаре
        const itemInfo = document.createElement('div');
        itemInfo.className = 'cart-item-info';
        itemInfo.style.flex = '1';
        
        const itemName = document.createElement('strong');
        itemName.textContent = item.name;
        itemName.style.display = 'block';
        itemName.style.marginBottom = '5px';
        
        const itemPrice = document.createElement('div');
        itemPrice.className = 'cart-item-price';
        itemPrice.textContent = `${item.price.toLocaleString('ru-RU')} ₽`;
        itemPrice.style.color = '#2ecc71';
        itemPrice.style.fontWeight = 'bold';
        itemPrice.style.fontSize = '1.1rem';
        
        itemInfo.appendChild(itemName);
        itemInfo.appendChild(itemPrice);
        
        // Кнопка удаления
        const removeButton = document.createElement('button');
        removeButton.className = 'remove-item';
        removeButton.setAttribute('data-index', index);
        removeButton.title = 'Удалить из корзины';
        removeButton.style.background = '#e74c3c';
        removeButton.style.color = 'white';
        removeButton.style.border = 'none';
        removeButton.style.width = '32px';
        removeButton.style.height = '32px';
        removeButton.style.borderRadius = '50%';
        removeButton.style.display = 'flex';
        removeButton.style.alignItems = 'center';
        removeButton.style.justifyContent = 'center';
        removeButton.style.cursor = 'pointer';
        removeButton.style.marginLeft = '10px';
        removeButton.style.transition = 'all 0.3s';
        
        removeButton.addEventListener('mouseover', function() {
            this.style.background = '#c0392b';
            this.style.transform = 'scale(1.1)';
        });
        
        removeButton.addEventListener('mouseout', function() {
            this.style.background = '#e74c3c';
            this.style.transform = 'scale(1)';
        });
        
        const trashIcon = document.createElement('i');
        trashIcon.className = 'fas fa-trash';
        trashIcon.style.fontSize = '0.9rem';
        removeButton.appendChild(trashIcon);
        
        itemElement.appendChild(itemInfo);
        itemElement.appendChild(removeButton);
        cartItemsContainer.appendChild(itemElement);
    });
    
    console.log('💰 Общая сумма:', total.toLocaleString('ru-RU'), '₽');
    
    if (cartTotalElement) {
        cartTotalElement.textContent = `${total.toLocaleString('ru-RU')} ₽`;
        cartTotalElement.style.fontWeight = 'bold';
        cartTotalElement.style.fontSize = '1.4rem';
        cartTotalElement.style.color = '#2c3e50';
        cartTotalElement.style.textAlign = 'right';
        cartTotalElement.style.marginTop = '15px';
        cartTotalElement.style.paddingTop = '15px';
        cartTotalElement.style.borderTop = '2px solid #3498db';
    }
    
    if (checkoutBtn) {
        checkoutBtn.disabled = false;
        checkoutBtn.style.background = '#2ecc71';
        checkoutBtn.style.color = 'white';
        checkoutBtn.innerHTML = 'Оформить заказ';
    }
    
    // Обработчики удаления (гарантируем, что они добавляются только один раз)
    document.querySelectorAll('.remove-item').forEach(button => {
        // Удаляем все существующие обработчики
        const clone = button.cloneNode(true);
        button.parentNode.replaceChild(clone, button);
        
        // Добавляем новый обработчик
        clone.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            console.log(`🗑️ Удаление товара по индексу: ${index}`);
            removeFromCart(index);
        });
    });
    
    console.log('✅ Отображение корзины обновлено успешно');
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
    showToast(`✅ Товар "${removedItem.name}" удален из корзины`, 'success', 3000);
}

// Предотвращение двойного клика на кнопках
let isProcessing = false;

// Добавление товара в корзину с защитой от двойного клика
function addToCart(product) {
    if (isProcessing) {
        console.warn('⏳ Обработка предыдущего клика еще не завершена');
        return;
    }
    
    isProcessing = true;
    console.log('➕ Добавление товара в корзину:', product);
    
    // Проверка, есть ли уже такой товар в корзине
    const existingItemIndex = cart.findIndex(item => item.id === product.id);
    
    if (existingItemIndex !== -1) {
        console.log('🔄 Товар уже есть в корзине, увеличиваем количество');
        // Если нужно увеличивать количество вместо добавления дубликата:
        // cart[existingItemIndex].quantity = (cart[existingItemIndex].quantity || 1) + 1;
        // Но пока просто добавляем как новый товар
    }
    
    cart.push(product);
    localStorage.setItem('cart', JSON.stringify(cart));
    console.log('💾 Корзина сохранена в localStorage');
    console.log('🛒 Корзина после добавления:', cart);
    
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
    
    // Сброс флага обработки через 500мс
    setTimeout(() => {
        isProcessing = false;
    }, 500);
}

// Очистка корзины (для отладки)
function clearCart() {
    if (confirm('Очистить корзину?')) {
        cart = [];
        localStorage.removeItem('cart');
        updateCartDisplay();
        showToast('✅ Корзина очищена', 'info', 2000);
    }
}

// Показать уведомление
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

// Обработчики для модального окна корзины
function setupCartModal() {
    console.log('🔧 Настройка модального окна корзины');
    
    const cartBtn = document.getElementById('cart-btn');
    const cartModal = document.getElementById('cart-modal');
    const closeBtn = document.querySelector('.close');
    
    if (cartBtn) {
        // Удаляем все существующие обработчики
        const clone = cartBtn.cloneNode(true);
        cartBtn.parentNode.replaceChild(clone, cartBtn);
        
        clone.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🛒 Открытие модального окна корзины');
            
            if (cartModal) {
                cartModal.style.display = 'flex';
                cartModal.style.animation = 'fadeIn 0.3s';
                updateCartDisplay();
            }
        });
    } else {
        console.warn('⚠️ Кнопка корзины (cart-btn) не найдена');
    }
    
    if (closeBtn && cartModal) {
        // Удаляем все существующие обработчики
        const clone = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(clone, closeBtn);
        
        clone.addEventListener('click', function() {
            console.log('❌ Закрытие модального окна корзины');
            cartModal.style.display = 'none';
        });
    }
    
    if (cartModal) {
        window.addEventListener('click', function(e) {
            if (e.target === cartModal) {
                console.log('❌ Закрытие модального окна по клику вне области');
                cartModal.style.display = 'none';
            }
        });
        
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && cartModal.style.display === 'flex') {
                console.log('❌ Закрытие модального окна по клавише Esc');
                cartModal.style.display = 'none';
            }
        });
    }
}

// Инициализация кнопок добавления в корзину
function initAddToCartButtons() {
    console.log('🔧 Инициализация кнопок добавления в корзину');
    
    // Удаляем все существующие обработчики со всех кнопок
    document.querySelectorAll('.add-to-cart').forEach(button => {
        const clone = button.cloneNode(true);
        button.parentNode.replaceChild(clone, button);
        
        clone.addEventListener('click', function(e) {
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
        });
    });
    
    // Обработчик для динамически добавляемых кнопок
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('add-to-cart') && !e.target.dataset.processed) {
            e.stopPropagation();
            e.preventDefault();
            
            console.log('🛒 Динамический клик по кнопке "В корзину"');
            
            const product = {
                id: e.target.getAttribute('data-id') || 'product-' + Date.now(),
                name: e.target.getAttribute('data-name') || 'Без названия',
                price: parseInt(e.target.getAttribute('data-price')) || 0,
                image: e.target.getAttribute('data-image') || ''
            };
            
            addToCart(product);
            e.target.dataset.processed = 'true';
        }
    }, true);
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM полностью загружен');
    
    // Проверка существования необходимых элементов
    const requiredElements = [
        'cart-count',
        'cart-items',
        'cart-total',
        'checkout-btn',
        'cart-modal'
    ];
    
    requiredElements.forEach(elementId => {
        if (!document.getElementById(elementId)) {
            console.warn(`⚠️ Элемент с ID "${elementId}" не найден в DOM`);
        }
    });
    
    // Инициализация корзины
    cart = JSON.parse(localStorage.getItem('cart')) || [];
    console.log('🛒 Загружена корзина из localStorage:', cart);
    
    // Настройка модального окна
    setupCartModal();
    
    // Инициализация кнопок
    initAddToCartButtons();
    updateCartDisplay();
    
    console.log('🎉 Инициализация скрипта завершена успешно');
    
    // Для отладки - добавляем кнопку очистки корзины в режиме разработки
    if (window.location.hostname === 'localhost' || window.location.hostname.includes('github.io')) {
        setTimeout(() => {
            const debugBtn = document.createElement('button');
            debugBtn.textContent = 'Очистить корзину';
            debugBtn.style.position = 'fixed';
            debugBtn.style.bottom = '20px';
            debugBtn.style.left = '20px';
            debugBtn.style.zIndex = '1000';
            debugBtn.style.padding = '8px 12px';
            debugBtn.style.backgroundColor = '#e74c3c';
            debugBtn.style.color = 'white';
            debugBtn.style.border = 'none';
            debugBtn.style.borderRadius = '5px';
            debugBtn.style.cursor = 'pointer';
            
            debugBtn.addEventListener('click', clearCart);
            
            document.body.appendChild(debugBtn);
        }, 1000);
    }
});

console.log('✅ main.js успешно загружен и инициализирован');
