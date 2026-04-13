/**
 * docs/js/cart-module.js
 * Логика корзины
 */

const CartModule = (function() {
    let items = [];
    const STORAGE_KEY = 'fto_cart_v3';

    function init() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) items = JSON.parse(stored);
        updateCounter();
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
            alert(`Товар "${product.name}" уже в корзине. Количество увеличено.`);
        } else {
            items.push({ ...product, qty: 1 });
            alert(`Товар "${product.name}" добавлен в корзину!`);
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
        const els = document.querySelectorAll('.cart-count');
        const count = getCount();
        els.forEach(el => {
            el.textContent = count;
            el.style.display = count > 0 ? 'inline-block' : 'none';
        });
    }

    // Отрисовка содержимого модального окна
    function renderModalBody() {
        const container = document.getElementById('cart-items-container');
        const totalEl = document.getElementById('cart-total-display');
        const btnCheckout = document.getElementById('btn-checkout');

        if (!container) return;

        container.innerHTML = '';
        
        if (items.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#777;">Корзина пуста</p>';
            if(btnCheckout) btnCheckout.disabled = true;
            if(totalEl) totalEl.textContent = '0 ₽';
            return;
        }

        if(btnCheckout) btnCheckout.disabled = false;

        items.forEach(item => {
            const row = document.createElement('div');
            row.style.cssText = 'display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #eee; padding:10px 0;';
            row.innerHTML = `
                <div>
                    <div style="font-weight:bold;">${Utils.sanitize(item.name)}</div>
                    <div style="font-size:0.9em; color:#666;">${Utils.formatPrice(item.price)}</div>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                    <button onclick="CartModule.changeQty('${item.id}', -1)" style="width:25px;height:25px;">-</button>
                    <span>${item.qty}</span>
                    <button onclick="CartModule.changeQty('${item.id}', 1)" style="width:25px;height:25px;">+</button>
                    <button onclick="CartModule.remove('${item.id}')" style="color:red; border:none; background:none; cursor:pointer; margin-left:5px;">✕</button>
                </div>
            `;
            container.appendChild(row);
        });

        if (totalEl) totalEl.textContent = Utils.formatPrice(getTotal());
    }

    // Публичный метод для открытия модального окна извне
    function openModal() {
        renderModalBody();
        const modal = document.getElementById('cart-modal');
        if (modal) {
            modal.style.display = 'flex'; // Используем flex для центровки
            document.body.style.overflow = 'hidden'; // Блокируем прокрутку фона
        }
    }

    function closeModal() {
        const modal = document.getElementById('cart-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    function getItems() {
        return [...items];
    }

    function clear() {
        items = [];
        save();
        closeModal();
    }

    // Инициализация при загрузке
    init();

    return {
        add, remove, changeQty,
        getTotal, getCount,
        openModal, closeModal,
        getItems, clear,
        renderModalBody // Экспортируем для обновления при изменении количества
    };
})();