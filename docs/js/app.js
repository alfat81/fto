/**
 * docs/js/app.js
 * Точка входа приложения
 */

document.addEventListener('DOMContentLoaded', () => {
    setupGlobalListeners();
    loadCatalogIfNeed();
});

function setupGlobalListeners() {
    // 1. Открытие корзины
    const cartTriggers = document.querySelectorAll('[data-action="open-cart"]');
    cartTriggers.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            CartModule.openModal();
        });
    });

    // 2. Закрытие корзины (крестик и клик вне области)
    const closeBtns = document.querySelectorAll('.close-modal');
    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => CartModule.closeModal());
    });

    const modalOverlay = document.getElementById('cart-modal');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) CartModule.closeModal();
        });
    }

    // 3. Обработка форм
    const contactForm = document.getElementById('contact-form');
    if (contactForm) contactForm.addEventListener('submit', handleContactSubmit);

    const orderForm = document.getElementById('order-form');
    if (orderForm) orderForm.addEventListener('submit', handleOrderSubmit);
}

// Динамическая загрузка каталога, если мы на странице catalog.html
function loadCatalogIfNeed() {
    const grid = document.getElementById('catalog-grid');
    if (!grid || typeof CATALOG_DATA === 'undefined') return;

    renderCatalog(grid);
}

function renderCatalog(container) {
    container.innerHTML = '';
    
    // Группировка по категориям
    const categories = {};
    CATALOG_DATA.forEach(item => {
        if (!categories[item.category]) categories[item.category] = [];
        categories[item.category].push(item);
    });

    // Рендеринг секций
    Object.keys(categories).forEach(catId => {
        const sectionTitle = CATEGORY_NAMES[catId] || `Раздел ${catId}`;
        
        const sectionHtml = `
            <div class="catalog-section" style="margin-bottom: 40px;">
                <h2 class="section-title" style="border-bottom: 2px solid #d32f2f; display:inline-block; padding-bottom:5px; margin-bottom:20px; color:#333;">
                    ${sectionTitle}
                </h2>
                <div class="products-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(250px, 1fr)); gap:20px;">
                    ${categories[catId].map(product => createProductCard(product)).join('')}
                </div>
            </div>
        `;
        container.innerHTML += sectionHtml;
    });
}

function createProductCard(product) {
    const imgUrl = Utils.getProductImage(product.id);
    
    // Карточка в едином стиле
    return `
        <div class="product-card" style="border:1px solid #e0e0e0; border-radius:8px; overflow:hidden; transition:transform 0.2s, box-shadow 0.2s; background:#fff; display:flex; flex-direction:column;">
            <div style="height:200px; overflow:hidden; background:#f9f9f9; display:flex; align-items:center; justify-content:center;">
                <img src="${imgUrl}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/300x200?text=Нет+фото'" 
                     style="width:100%; height:100%; object-fit:contain; padding:10px;">
            </div>
            <div style="padding:15px; flex-grow:1; display:flex; flex-direction:column;">
                <h3 style="margin:0 0 10px; font-size:1.1em; color:#333;">${product.name}</h3>
                <p style="font-size:0.9em; color:#666; margin-bottom:10px; flex-grow:1;">${product.description}</p>
                
                <ul style="font-size:0.85em; color:#777; padding-left:20px; margin-bottom:15px;">
                    ${product.specs ? product.specs.map(s => `<li>${s}</li>`).join('') : ''}
                </ul>

                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto;">
                    <span style="font-size:1.2em; font-weight:bold; color:#d32f2f;">${Utils.formatPrice(product.price)}</span>
                    <button class="btn-add-to-cart" data-id="${product.id}" 
                            style="background:#d32f2f; color:#fff; border:none; padding:8px 15px; border-radius:4px; cursor:pointer; transition:background 0.2s;">
                        В корзину
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Навешиваем обработчик на динамические кнопки "В корзину"
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-add-to-cart')) {
        const id = e.target.dataset.id;
        const product = CATALOG_DATA.find(p => p.id === id);
        if (product) CartModule.add(product);
    }
});

async function handleContactSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    
    btn.disabled = true;
    btn.textContent = 'Отправка...';

    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    const message = `
📩 <b>Заявка с сайта (Контакты)</b>
👤 Имя: ${data.name}
📞 Телефон: ${data.phone}
✉️ Email: ${data.email}
💬 Сообщение: ${data.message}
    `;

    await sendToTelegram(message);

    btn.disabled = false;
    btn.textContent = originalText;
    alert('Сообщение отправлено!');
    form.reset();
}

async function handleOrderSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    const items = CartModule.getItems();

    if (items.length === 0) return alert('Корзина пуста!');

    btn.disabled = true;
    btn.textContent = 'Обработка...';

    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    let itemsList = items.map(i => `▪️ ${i.name} x${i.qty} - ${Utils.formatPrice(i.price * i.qty)}`).join('\n');
    const total = Utils.formatPrice(CartModule.getTotal());

    const message = `
🛒 <b>НОВЫЙ ЗАКАЗ!</b>
👤 Клиент: ${data.name}
📞 Телефон: ${data.phone}
📍 Адрес: ${data.address || 'Не указан'}

<b>Заказ:</b>
${itemsList}

💰 <b>Итого: ${total}</b>
    `;

    await sendToTelegram(message);

    btn.disabled = false;
    btn.textContent = 'Заказать';
    alert('Заказ успешно оформлен! Менеджер свяжется с вами.');
    CartModule.clear();
    form.reset();
}

async function sendToTelegram(text) {
    const { token, chatId } = APP_CONFIG.telegram;
    if (!token || !chatId || token === 'ВАШ_ТОКЕН_БОТА') {
        console.warn('Telegram не настроен! Сообщение:', text);
        alert('Режим демонстрации: заявка не отправлена (не настроен Telegram).');
        return;
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: 'HTML'
            })
        });
        if (!res.ok) throw new Error('TG Error');
    } catch (err) {
        console.error(err);
        alert('Ошибка отправки. Проверьте консоль.');
    }
}