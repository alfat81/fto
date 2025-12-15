// Обновленная корзина с адаптивным фреймом
class ShoppingCart {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('cart')) || [];
        this.API_URL = 'https://fto-tdks.onrender.com/api/order';
        this.cartContainer = document.querySelector('.cart-container');
        this.overlay = document.querySelector('.cart-overlay');
        this.isOpen = false;
        this.init();
    }

    init() {
        console.log('✅ Адаптивная корзина инициализирована');
        
        // Загружаем товары в корзину
        this.renderCartItems();
        
        // Обновляем счетчик товаров
        this.updateCartCount();
        
        // Настраиваем обработчики событий
        this.setupEventListeners();
    }

    // Настройка обработчиков событий
    setupEventListeners() {
        // Кнопка открытия корзины
        const cartBtn = document.querySelector('.cart-toggle-btn');
        if (cartBtn) {
            cartBtn.addEventListener('click', () => this.toggleCart());
        }
        
        // Кнопка закрытия корзины
        const closeBtn = document.querySelector('.cart-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeCart());
        }
        
        // Закрытие по клику на overlay
        if (this.overlay) {
            this.overlay.addEventListener('click', () => this.closeCart());
        }
        
        // Закрытие по нажатию Esc
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeCart();
            }
        });
        
        // Обработка отправки формы заказа
        const checkoutForm = document.getElementById('checkout-form');
        if (checkoutForm) {
            checkoutForm.addEventListener('submit', (e) => this.handleOrderSubmission(e));
        }
        
        // Кнопки добавления товаров в корзину
        this.setupAddToCartButtons();
        
        // Кнопки изменения количества товаров
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('quantity-btn')) {
                const action = e.target.dataset.action;
                const productId = e.target.closest('.cart-product').dataset.productId;
                this.changeQuantity(productId, action);
            }
            
            if (e.target.classList.contains('remove-product') || 
                e.target.closest('.remove-product')) {
                const productId = e.target.closest('.cart-product').dataset.productId;
                this.removeFromCart(productId);
            }
        });
    }

    // Настройка кнопок добавления в корзину
    setupAddToCartButtons() {
        document.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const product = {
                    id: button.dataset.id || 'product-' + Date.now(),
                    name: button.dataset.name || 'Без названия',
                    price: parseInt(button.dataset.price) || 0,
                    image: button.dataset.image || 'images/placeholder-product.jpg',
                    quantity: 1
                };
                
                this.addToCart(product);
            });
        });
    }

    // Добавление товара в корзину
    addToCart(product) {
        // Проверяем, есть ли уже такой товар в корзине
        const existingProduct = this.cart.find(item => item.id === product.id);
        
        if (existingProduct) {
            existingProduct.quantity += 1;
        } else {
            this.cart.push(product);
        }
        
        // Сохраняем в localStorage
        this.saveCart();
        
        // Обновляем интерфейс
        this.renderCartItems();
        this.updateCartCount();
        
        // Показываем уведомление
        this.showToast(`✅ "${product.name}" добавлен в корзину!`, 'success');
        
        // Автоматически открываем корзину
        this.openCart();
    }

    // Удаление товара из корзины
    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
        this.renderCartItems();
        this.updateCartCount();
        this.showToast('✅ Товар удален из корзины', 'info');
    }

    // Изменение количества товара
    changeQuantity(productId, action) {
        const product = this.cart.find(item => item.id === productId);
        
        if (product) {
            if (action === 'decrease' && product.quantity > 1) {
                product.quantity -= 1;
            } else if (action === 'increase') {
                product.quantity += 1;
            }
            
            this.saveCart();
            this.renderCartItems();
        }
    }

    // Отображение товаров в корзине
    renderCartItems() {
        const cartItemsContainer = document.getElementById('cart-items-container');
        const cartTotalElement = document.getElementById('cart-total');
        const checkoutBtn = document.getElementById('checkout-btn');
        
        if (!cartItemsContainer || !cartTotalElement || !checkoutBtn) return;
        
        // Пустая корзина
        if (this.cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart">
                    <div class="empty-cart-icon">
                        <i class="fas fa-shopping-cart"></i>
                    </div>
                    <p class="empty-cart-text">Ваша корзина пуста</p>
                    <a href="catalog.html" class="btn empty-cart-button">Выбрать товары</a>
                </div>
            `;
            
            cartTotalElement.textContent = '0 ₽';
            checkoutBtn.disabled = true;
            return;
        }
        
        // Отображение товаров
        let total = 0;
        let itemsHTML = '';
        
        this.cart.forEach(product => {
            total += product.price * product.quantity;
            
            itemsHTML += `
                <div class="cart-product" data-product-id="${product.id}">
                    <div class="cart-product-image">
                        <img src="${product.image}" alt="${product.name}">
                    </div>
                    <div class="cart-product-info">
                        <div class="cart-product-name">${product.name}</div>
                        <div class="cart-product-price">${product.price.toLocaleString('ru-RU')} ₽</div>
                        <div class="cart-product-quantity">
                            <button class="quantity-btn" data-action="decrease">-</button>
                            <div class="quantity-value">${product.quantity}</div>
                            <button class="quantity-btn" data-action="increase">+</button>
                        </div>
                    </div>
                    <button class="remove-product">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        });
        
        cartItemsContainer.innerHTML = itemsHTML;
        cartTotalElement.textContent = `${total.toLocaleString('ru-RU')} ₽`;
        checkoutBtn.disabled = false;
    }

    // Обновление счетчика товаров
    updateCartCount() {
        const cartCountElements = document.querySelectorAll('.cart-count-badge');
        
        cartCountElements.forEach(element => {
            const count = this.cart.reduce((sum, item) => sum + item.quantity, 0);
            element.textContent = count;
            
            if (count === 0) {
                element.style.display = 'none';
            } else {
                element.style.display = 'flex';
            }
        });
    }

    // Открытие корзины
    openCart() {
        this.cartContainer.classList.add('open');
        this.overlay.classList.add('active');
        this.isOpen = true;
        document.body.style.overflow = 'hidden'; // Запрещаем прокрутку основного контента
    }

    // Закрытие корзины
    closeCart() {
        this.cartContainer.classList.remove('open');
        this.overlay.classList.remove('active');
        this.isOpen = false;
        document.body.style.overflow = 'auto'; // Возвращаем прокрутку
    }

    // Переключение состояния корзины
    toggleCart() {
        if (this.isOpen) {
            this.closeCart();
        } else {
            this.openCart();
        }
    }

    // Сохранение корзины в localStorage
    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
    }

    // Отправка заказа
    async handleOrderSubmission(e) {
        e.preventDefault();
        
        const form = e.target;
        const name = form.name.value.trim();
        const phone = form.phone.value.trim();
        const comment = form.comment.value.trim();
        
        // Валидация
        if (!name || name.length < 2) {
            this.showToast('Пожалуйста, введите ваше имя (минимум 2 символа)', 'error');
            form.name.focus();
            return;
        }
        
        if (!phone || !/^\+?7[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}$/.test(phone.replace(/\D/g, ''))) {
            this.showToast('Пожалуйста, введите корректный номер телефона в формате +7 (999) 123-45-67', 'error');
            form.phone.focus();
            return;
        }
        
        const checkoutBtn = document.getElementById('checkout-btn');
        checkoutBtn.disabled = true;
        checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
        
        try {
            const order = {
                items: this.cart,
                customer: {
                    name: name,
                    phone: phone,
                    comment: comment
                },
                total: this.cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
                date: new Date().toISOString()
            };
            
            console.log('📋 Отправка заказа:', order);
            
            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(order)
            });
            
            if (!response.ok) {
                throw new Error('Ошибка при отправке заказа');
            }
            
            // Очистка корзины
            this.cart = [];
            this.saveCart();
            this.renderCartItems();
            this.updateCartCount();
            form.reset();
            
            // Закрытие корзины
            this.closeCart();
            
            this.showToast('✅ Заказ успешно отправлен! Менеджер свяжется с вами в ближайшее время.', 'success');
            
        } catch (error) {
            console.error('❌ Ошибка при отправке заказа:', error);
            this.showToast(`❌ Ошибка при отправке заказа: ${error.message}\nПопробуйте снова или позвоните по телефону +7 (960) 178-67-38`, 'error');
        } finally {
            checkoutBtn.disabled = false;
            checkoutBtn.innerHTML = 'Оформить заказ';
        }
    }

    // Уведомления
    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toast-container') || this.createToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            ${message}
        `;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
    }

    // Создание контейнера для уведомлений
    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.style.position = 'fixed';
        container.style.top = '20px';
        container.style.right = '20px';
        container.style.zIndex = '9999';
        container.style.maxWidth = '350px';
        document.body.appendChild(container);
        return container;
    }
}

// Инициализация корзины при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    window.shoppingCart = new ShoppingCart();
});
