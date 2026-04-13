/**
 * docs/js/cart-module.js
 * Логика корзины (localStorage)
 */
const CartModule = (function() {
    let items = [];
    const STORAGE_KEY = 'fto_cart_v3';

    function init() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) items = JSON.parse(stored);
        updateCounter();
        renderModalBody();
    }

    function save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        updateCounter();
        renderModalBody();
    }

    function add(product) {
        const existing = items.find(i => i.id === product.id);
        if (existing) {
            existing.qty++;
        } else {
            items.push({ ...product, qty: 1 });
        }
        save();
    }

    function remove(id) {
        items = items.filter(i => i.id !== id);
        save();
    }

    function changeQty(id, delta) {
        const item = items.find(i => i.id === id);
        if (!item) return;
        item.qty += delta;
        if (item.qty <= 0) remove(id);
        else save();
    }

    function getTotal() {
        return items.reduce((sum, i) => sum + (i.price * i.qty), 0);
    }

    function getCount() {
        return items.reduce((sum, i) => sum + i.qty, 0);
    }

    function updateCounter() {
        // ИСПРАВЛЕНО: ищем и по классу и по ID
        const els = document.querySelectorAll('.cart-count, .cart-badge, #cart-count');
        const count = getCount();
        els.forEach(el => {
            el.textContent = count;
            el.style.display = count > 0 ? 'inline-block' : 'none';
        });
    }

    function renderModalBody() {
        const container = document.getElementById('cart-items-container');
        const totalEl = document.getElementById('cart-total-price');
        const btnCheckout = document.getElementById('checkout-btn');
        
        if (!container) return;
        container.innerHTML = '';

        if (items.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#777; padding:20px;">Корзина пуста</p>';
            if(btnCheckout) btnCheckout.disabled = true;
            if(totalEl) totalEl.textContent = '0 ₽';
            return;
        }

        if(btnCheckout) btnCheckout.disabled = false;

        items.forEach(item => {
            const row = document.createElement('div');
            row.className = 'cart-item';
            row.innerHTML = `
                <div style="flex:1;">
                    <div style="font-weight:bold;">${Utils.sanitize(item.name)}</div>
                    <div style="font-size:0.9em; color:#666;">${Utils.formatPrice(item.price)}</div>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                    <button onclick="CartModule.changeQty('${item.id}', -1)" style="width:28px;height:28px;border:1px solid #ddd;background:#fff;cursor:pointer;border-radius:4px;">-</button>
                    <span style="min-width:20px;text-align:center;">${item.qty}</span>
                    <button onclick="CartModule.changeQty('${item.id}', 1)" style="width:28px;height:28px;border:1px solid #ddd;background:#fff;cursor:pointer;border-radius:4px;">+</button>
                    <button onclick="CartModule.remove('${item.id}')" style="color:red; border:none; background:none; cursor:pointer; font-size:18px;">&times;</button>
                </div>
            `;
            container.appendChild(row);
        });

        if (totalEl) totalEl.textContent = Utils.formatPrice(getTotal());
    }

    // Публичные методы
    function openModal() {
        renderModalBody();
        const modal = document.getElementById('cart-modal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    function closeModal() {
        const modal = document.getElementById('cart-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    function getItems() { return [...items]; }
    function clear() { items = []; save(); closeModal(); }

    return {
        init, add, remove, changeQty,
        getTotal, getCount,
        openModal, closeModal,
        getItems, clear,
        renderModalBody
    };
})();