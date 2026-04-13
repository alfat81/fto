const CartModule = (function() {
    let cart = [];
    const KEY = APP_CONFIG.storage.cartKey;

    function load() {
        cart = Utils.getFromStorage(KEY) || [];
        updateUI();
    }

    function save() {
        Utils.saveToStorage(KEY, cart);
        updateUI();
    }

    function add(product) {
        const existing = cart.find(item => item.id === product.id);
        if (existing) {
            existing.quantity++;
            ToastModule.success(`Увеличено количество: ${product.name}`);
        } else {
            cart.push({ ...product, quantity: 1 });
            ToastModule.success(`${product.name} добавлен в корзину`);
        }
        save();
    }

    function remove(id) {
        cart = cart.filter(item => item.id !== id);
        save();
        ToastModule.info('Товар удален');
    }

    function updateQuantity(id, delta) {
        const item = cart.find(i => i.id === id);
        if (!item) return;
        item.quantity += delta;
        if (item.quantity <= 0) remove(id);
        else save();
    }

    function clear() {
        cart = [];
        save();
    }

    function getTotal() {
        return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    function getCount() {
        return cart.reduce((sum, item) => sum + item.quantity, 0);
    }

    function getItems() { return [...cart]; }

    function updateUI() {
        // Обновление счетчика в шапке
        const counters = document.querySelectorAll('.cart-count');
        const count = getCount();
        counters.forEach(el => {
            el.textContent = count;
            el.style.display = count > 0 ? 'inline-block' : 'none';
        });

        // Перерисовка модального окна, если открыто
        const body = document.getElementById('cart-items-body');
        const totalEl = document.getElementById('cart-total-sum');
        const btn = document.getElementById('checkout-btn');

        if (body) {
            body.innerHTML = '';
            if (cart.length === 0) {
                body.innerHTML = '<p style="text-align:center; padding:20px;">Корзина пуста</p>';
                if(btn) btn.disabled = true;
            } else {
                if(btn) btn.disabled = false;
                cart.forEach(item => {
                    const row = document.createElement('div');
                    // Используем классы, которые могут быть в style.css, или инлайновые для гарантии
                    row.style.cssText = 'display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #eee; padding:10px 0;';
                    row.innerHTML = `
                        <div>
                            <div style="font-weight:bold;">${item.name}</div>
                            <div style="font-size:0.9em; color:#666;">${Utils.formatCurrency(item.price)}</div>
                        </div>
                        <div style="display:flex; align-items:center; gap:10px;">
                            <button onclick="CartModule.updateQuantity('${item.id}', -1)" style="width:25px;height:25px;">-</button>
                            <span>${item.quantity}</span>
                            <button onclick="CartModule.updateQuantity('${item.id}', 1)" style="width:25px;height:25px;">+</button>
                            <button onclick="CartModule.remove('${item.id}')" style="color:red;border:none;background:none;cursor:pointer;margin-left:5px;">&times;</button>
                        </div>
                    `;
                    body.appendChild(row);
                });
            }
        }
        if (totalEl) totalEl.textContent = Utils.formatCurrency(getTotal());
    }

    // Автозагрузка при подключении
    load();

    return { add, remove, updateQuantity, clear, getTotal, getCount, getItems, load, updateUI };
})();