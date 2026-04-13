const CartModule = (function() {
    let items = [];
    const KEY = 'fto_cart_v3';

    function init() {
        const stored = localStorage.getItem(KEY);
        if (stored) items = JSON.parse(stored);
        updateUI();
    }

    function save() {
        localStorage.setItem(KEY, JSON.stringify(items));
        updateUI();
    }

    function add(product) {
        const exist = items.find(i => i.id === product.id);
        exist ? exist.qty++ : items.push({ ...product, qty: 1 });
        save();
    }

    function remove(id) { items = items.filter(i => i.id !== id); save(); }
    function changeQty(id, d) {
        const item = items.find(i => i.id === id);
        if (!item) return;
        item.qty += d;
        if (item.qty <= 0) remove(id); else save();
    }

    function getTotal() { return items.reduce((s, i) => s + i.price * i.qty, 0); }
    function getCount() { return items.reduce((s, i) => s + i.qty, 0); }

    function updateUI() {
        const count = getCount();
        document.querySelectorAll('.cart-badge, .cart-count').forEach(el => {
            el.textContent = count;
            el.style.display = count > 0 ? 'inline-block' : 'none';
        });
        renderModal();
    }

    function renderModal() {
        const box = document.getElementById('cart-items-container');
        const totalEl = document.getElementById('cart-total-price');
        const btn = document.getElementById('checkout-btn');
        if (!box) return;
        box.innerHTML = '';
        if (items.length === 0) {
            box.innerHTML = '<p style="text-align:center; padding:20px; color:#777;">Корзина пуста</p>';
            if(btn) btn.disabled = true;
            if(totalEl) totalEl.textContent = '0 ₽';
            return;
        }
        if(btn) btn.disabled = false;
        items.forEach(i => {
            box.innerHTML += `
                <div class="cart-item">
                    <div><strong>${Utils.sanitize(i.name)}</strong><br><small>${Utils.formatPrice(i.price)}</small></div>
                    <div style="display:flex; gap:8px; align-items:center;">
                        <button onclick="CartModule.changeQty('${i.id}', -1)" style="width:24px;height:24px;border:1px solid #ddd;background:#fff;cursor:pointer;border-radius:4px;">-</button>
                        <span>${i.qty}</span>
                        <button onclick="CartModule.changeQty('${i.id}', 1)" style="width:24px;height:24px;border:1px solid #ddd;background:#fff;cursor:pointer;border-radius:4px;">+</button>
                        <button onclick="CartModule.remove('${i.id}')" style="border:none;background:none;color:red;cursor:pointer;font-size:18px;">&times;</button>
                    </div>
                </div>`;
        });
        if(totalEl) totalEl.textContent = Utils.formatPrice(getTotal());
    }

    function openModal() { renderModal(); document.getElementById('cart-modal').style.display = 'flex'; document.body.style.overflow = 'hidden'; }
    function closeModal() { document.getElementById('cart-modal').style.display = 'none'; document.body.style.overflow = ''; }
    function clear() { items = []; save(); closeModal(); }
    function getItems() { return [...items]; }

    return { init, add, remove, changeQty, getTotal, getCount, openModal, closeModal, clear, getItems };
})();