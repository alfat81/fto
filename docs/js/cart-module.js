/**
 * cart-module.js
 * Модуль управления корзиной покупок.
 * Работает с localStorage и обновляет интерфейс.
 */

const CartModule = (function() {
    let cart = [];
    const STORAGE_KEY = APP_CONFIG.storage.cartKey;

    // Загрузка корзины при старте
    function load() {
        const stored = Utils.getFromStorage(STORAGE_KEY);
        cart = Array.isArray(stored) ? stored : [];
        updateUI();
    }

    // Сохранение корзины
    function save() {
        Utils.saveToStorage(STORAGE_KEY, cart);
        updateUI();
    }

    // Добавление товара
    function add(product) {
        const existingIndex = cart.findIndex(item => item.id === product.id);
        
        if (existingIndex > -1) {
            cart[existingIndex].quantity += 1;
            ToastModule.success(`Количество товара "${product.name}" увеличено`);
        } else {
            cart.push({ ...product, quantity: 1 });
            ToastModule.success(`Товар "${product.name}" добавлен в корзину`);
        }
        save();
    }

    // Удаление товара
    function remove(productId) {
        cart = cart.filter(item => item.id !== productId);
        ToastModule.info('Товар удален из корзины');
        save();
    }

    // Изменение количества
    function updateQuantity(productId, newQuantity) {
        const item = cart.find(item => item.id === productId);
        if (!item) return;

        if (newQuantity <= 0) {
            remove(productId);
        } else {
            item.quantity = newQuantity;
            save();
        }
    }

    // Очистка корзины
    function clear() {
        cart = [];
        save();
        ToastModule.warning('Корзина очищена');
    }

    // Подсчет общей суммы
    function getTotal() {
        return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    // Подсчет количества позиций
    function getCount() {
        return cart.reduce((count, item) => count + item.quantity, 0);
    }

    // Получение содержимого корзины
    function getItems() {
        return [...cart];
    }

    // Обновление интерфейса (счетчики в шапке, модальные окна)
    function updateUI() {
        // Обновляем счетчик в шапке, если он есть
        const counters = document.querySelectorAll('.cart-count');
        const count = getCount();
        counters.forEach(el => {
            el.textContent = count;
            el.style.display = count > 0 ? 'inline-block' : 'none';
        });

        // Если открыто модальное окно корзины, перерисовываем его
        const cartBody = document.getElementById('cart-items-body');
        if (cartBody) {
            renderCartModal(cartBody);
        }
        
        const cartTotal = document.getElementById('cart-total-sum');
        if (cartTotal) {
            cartTotal.textContent = Utils.formatCurrency(getTotal());
        }
    }

    // Рендеринг списка товаров в модальном окне
    function renderCartModal(container) {
        container.innerHTML = '';
        
        if (cart.length === 0) {
            container.innerHTML = '<p class="text-center py-4">Корзина пуста</p>';
            document.getElementById('checkout-btn').disabled = true;
            return;
        }

        document.getElementById('checkout-btn').disabled = false;

        cart.forEach(item => {
            const row = document.createElement('div');
            row.className = 'cart-item-row';
            row.style.cssText = 'display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #eee; padding:10px 0;';
            
            row.innerHTML = `
                <div style="flex:1;">
                    <div style="font-weight:bold;">${item.name}</div>
                    <div style="color:#666; font-size:0.9em;">${Utils.formatCurrency(item.price)}</div>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                    <button onclick="CartModule.updateQuantity('${item.id}', ${item.quantity - 1})" 
                            style="width:30px; height:30px; border:1px solid #ddd; background:#fff; cursor:pointer;">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="CartModule.updateQuantity('${item.id}', ${item.quantity + 1})" 
                            style="width:30px; height:30px; border:1px solid #ddd; background:#fff; cursor:pointer;">+</button>
                    <button onclick="CartModule.remove('${item.id}')" 
                            style="margin-left:10px; color:red; background:none; border:none; cursor:pointer;">&times;</button>
                </div>
            `;
            container.appendChild(row);
        });
    }

    // Инициализация
    load();

    return {
        add,
        remove,
        updateQuantity,
        clear,
        getTotal,
        getCount,
        getItems,
        load,
        updateUI
    };
})();