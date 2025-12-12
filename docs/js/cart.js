// Корзина товаров с интеграцией Telegram
class Cart {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('cart')) || [];
        this.API_URL = 'https://fto-tdks.onrender.com/api/order';
        this.init();
    }

    init() {
        console.log('✅ Корзина инициализирована');
        this.loadCartModal();
        this.setupEventListeners();
        this.updateCartDisplay();
        this.setupDebugTools();
    }

    // Загрузка модального окна корзины
    async loadCartModal() {
        try {
            const response = await fetch('components/cart-modal.html');
            if (!response.ok) throw new Error('Не удалось загрузить модальное окно корзины');
            
            const html = await response.text();
            const modalContainer = document.getElementById('cart-modal-container');
            if (modalContainer) {
                modalContainer.innerHTML = html;
                console.log('✅ Модальное окно корзины загружено');
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки модального окна корзины:', error);
            this.createFallbackCartModal();
        }
    }

    // Резервное создание модального окна
    createFallbackCartModal() {
        const modalContainer = document.getElementById('cart-modal-container');
        if (!modalContainer) return;
        
        modalContainer.innerHTML = `
            <div id="cart-modal" class="modal">
                <div class="modal-content">
                    <span class="close">&times;</span>
                    <h2>Ваша корзина</h2>
                    <div id="cart-items"></div>
                    <div class="cart-total">
                        <strong>Итого:</strong> <span id="cart-total">0 ₽</span>
                    </div>
                    <form id="checkout-form">
                        <div class="cart-form">
                            <input type="text" id="name" name="name" placeholder="Ваше имя*" required autocomplete="name">
                            <input type="tel" id="phone" name="phone" placeholder="Ваш телефон*" required autocomplete="tel">
                            <textarea id="comment" name="comment" placeholder="Комментарий к заказу" autocomplete="off"></textarea>
                            <button type="submit" id="checkout-btn" class="btn" disabled>Оформить заказ</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        console.log('✅ Резервное модальное окно корзины создано');
    }

    // Настройка обработчиков событий
    setupEventListeners() {
        // Кнопка корзины в шапке
        const cartBtn = document.getElementById('cart-btn');
        if (cartBtn) {
            cartBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openCartModal();
            });
        }

        // Закрытие модального окна
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('close') || 
                e.target.closest('.close')) {
                this.closeCartModal();
            }
        });

        // Закрытие по клику вне модального окна
        const cartModal = document.getElementById('cart-modal');
        if (cartModal) {
            cartModal.addEventListener('click', (e) => {
                if (e.target === cartModal) {
                    this.closeCartModal();
                }
            });
        }

        // Закрытие по нажатию Esc
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.getElementById('cart-modal').style.display === 'flex') {
                this.closeCartModal();
            }
        });

        // Добавление товаров в корзину
        document.addEventListener('click', (e) => {
            const addToCartBtn = e.target.closest('.add-to-cart');
            if (addToCartBtn && !addToCartBtn.dataset.processed) {
                e.preventDefault();
                e.stopPropagation();
                
                const product = {
                    id: addToCartBtn.dataset.id || 'product-' + Date.now(),
                    name: addToCartBtn.dataset.name || 'Без названия',
                    price: parseInt(addToCartBtn.dataset.price) || 0,
                    image: addToCartBtn.dataset.image || ''
                };
                
                this.addToCart(product);
                addToCartBtn.dataset.processed = 'true';
            }
        }, true);
    }

    // Открытие модального окна корзины
    openCartModal() {
        const cartModal = document.getElementById('cart-modal');
        if (cartModal) {
            cartModal.style.display = 'flex';
            setTimeout(() => {
                cartModal.style.opacity = '1';
            }, 10);
            this.updateCartDisplay();
            console.log('🛒 Модальное окно корзины открыто');
        }
    }

    // Закрытие модального окна корзины
    closeCartModal() {
        const cartModal = document.getElementById('cart-modal');
        if (cartModal) {
            cartModal.style.opacity = '0';
            setTimeout(() => {
                cartModal.style.display = 'none';
            }, 300);
            console.log('🛒 Модальное окно корзины закрыто');
        }
    }

    // Добавление товара в корзину
    addToCart(product) {
        // Проверка на дубликаты
        const existingItem = this.cart.find(item => item.id === product.id);
        if (existingItem) {
            this.showToast('Товар уже добавлен в корзину', 'info');
            return;
        }

        this.cart.push(product);
        this.saveCartToLocalStorage();
        this.updateCartDisplay();
        
        this.showToast(`✅ "${product.name}" добавлен в корзину!`, 'success');
        this.animateCartButton();
        
        console.log('➕ Товар добавлен в корзину:', product);
    }

    // Удаление товара из корзины
    removeFromCart(index) {
        if (index < 0 || index >= this.cart.length) {
            console.error('❌ Неверный индекс для удаления:', index);
            return;
        }

        const removedItem = this.cart[index];
        this.cart.splice(index, 1);
        this.saveCartToLocalStorage();
        this.updateCartDisplay();
        
        this.showToast(`✅ Товар "${removedItem.name}" удален из корзины`, 'success');
        console.log('🧹 Товар удален из корзины:', removedItem);
    }

    // Обновление отображения корзины
    updateCartDisplay() {
        const cartCount = document.getElementById('cart-count');
        if (cartCount) {
            cartCount.textContent = this.cart.length;
        }

        const cartItemsContainer = document.getElementById('cart-items');
        const cartTotalElement = document.getElementById('cart-total');
        const checkoutBtn = document.getElementById('checkout-btn');

        if (!cartItemsContainer) return;

        // Пустая корзина
        if (this.cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <p class="empty-cart">
                    <i class="fas fa-shopping-cart"></i><br>
                    Ваша корзина пуста
                </p>
            `;
            
            if (cartTotalElement) cartTotalElement.textContent = '0 ₽';
            if (checkoutBtn) checkoutBtn.disabled = true;
            
            console.log('🛒 Корзина пуста');
            return;
        }

        // Отображение товаров
        let total = 0;
        let itemsHTML = '';

        this.cart.forEach((item, index) => {
            total += item.price;
            itemsHTML += `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <strong>${item.name}</strong>
                        <div class="cart-item-price">${item.price.toLocaleString('ru-RU')} ₽</div>
                    </div>
                    <button class="remove-item" data-index="${index}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        });

        cartItemsContainer.innerHTML = itemsHTML;
        
        if (cartTotalElement) {
            cartTotalElement.textContent = `${total.toLocaleString('ru-RU')} ₽`;
        }
        
        if (checkoutBtn) {
            checkoutBtn.disabled = false;
        }

        // Обработчики удаления
        document.querySelectorAll('.remove-item').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.index);
                this.removeFromCart(index);
            });
        });

        console.log('🔄 Отображение корзины обновлено');
    }

    // Сохранение корзины в localStorage
    saveCartToLocalStorage() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
        console.log('💾 Корзина сохранена в localStorage');
    }

    // Анимация кнопки корзины
    animateCartButton() {
        const cartBtn = document.getElementById('cart-btn');
        if (cartBtn) {
            cartBtn.style.transform = 'scale(1.2)';
            setTimeout(() => {
                cartBtn.style.transform = 'scale(1)';
            }, 300);
        }
    }

    // Отправка заказа в Telegram
    async sendOrderToTelegram(orderData) {
        try {
            const response = await fetch(this.API_URL, {
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

            const result = await response.json();
            console.log('✅ Заказ успешно отправлен в Telegram:', result);
            return result;
        } catch (error) {
            console.error('🔥 Ошибка отправки заказа в Telegram:', error);
            throw error;
        }
    }

    // Оформление заказа
    async handleOrderSubmission(formEvent) {
        formEvent.preventDefault();
        
        if (this.cart.length === 0) {
            this.showToast('Корзина пуста! Добавьте товары для оформления заказа.', 'error');
            return;
        }

        const form = formEvent.target;
        const name = form.name.value.trim();
        const phone = form.phone.value.trim();
        const comment = form.comment.value.trim();

        // Валидация данных
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

        const order = {
            items: this.cart,
            customer: {
                name: name,
                phone: phone,
                comment: comment
            },
            total: this.calculateTotal(),
            date: new Date().toISOString()
        };

        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.disabled = true;
            checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
        }

        try {
            console.log('📋 Оформление заказа:', order);
            const result = await this.sendOrderToTelegram(order);
            
            // Очистка после успешного заказа
            this.cart = [];
            this.saveCartToLocalStorage();
            this.updateCartDisplay();
            form.reset();
            this.closeCartModal();
            
            this.showToast('✅ Заказ успешно отправлен!\nМенеджер свяжется с вами в ближайшее время.', 'success');
            
        } catch (error) {
            this.showToast(`❌ Ошибка при отправке заказа: ${error.message}\nПопробуйте снова или позвоните по телефону +7 (960) 178-67-38`, 'error');
        } finally {
            if (checkoutBtn) {
                checkoutBtn.disabled = false;
                checkoutBtn.innerHTML = 'Оформить заказ';
            }
        }
    }

    // Расчет общей суммы
    calculateTotal() {
        return this.cart.reduce((sum, item) => sum + item.price, 0);
    }

    // Показ уведомления
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
            toast.classList.add('fade-out');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 500);
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

    // Установка инструментов отладки
    setupDebugTools() {
        // Кнопка очистки корзины для разработки
        if (window.location.hostname === 'localhost' || window.location.hostname.includes('github.io')) {
            setTimeout(() => {
                const debugBtn = document.createElement('button');
                debugBtn.className = 'debug-clear-cart';
                debugBtn.innerHTML = '<i class="fas fa-trash"></i> Очистить корзину';
                debugBtn.addEventListener('click', () => {
                    if (confirm('Очистить корзину?')) {
                        this.cart = [];
                        this.saveCartToLocalStorage();
                        this.updateCartDisplay();
                        this.showToast('✅ Корзина очищена', 'info');
                    }
                });
                document.body.appendChild(debugBtn);
            }, 1000);
        }
    }
}

// Инициализация корзины при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    window.cart = new Cart();
    
    // Обработка отправки формы заказа
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', (e) => {
            if (window.cart) {
                window.cart.handleOrderSubmission(e);
            }
        });
    }
});
