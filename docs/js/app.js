/**
 * docs/js/app.js
 * Точка входа приложения. Связывает HTML и JS модули.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Инициализация корзины (считывание из localStorage)
    if (typeof CartModule !== 'undefined') {
        CartModule.init(); 
    }

    setupEventListeners();
    setupForms();
    loadCatalogIfNeed();
});

/**
 * Настройка всех кнопок и кликов
 */
function setupEventListeners() {
    // 1. Открытие корзины (ИСПРАВЛЕНО: ищем #cart-trigger)
    const cartTrigger = document.getElementById('cart-trigger');
    if (cartTrigger) {
        cartTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof CartModule !== 'undefined') {
                CartModule.openModal();
            }
        });
    }

    // 2. Закрытие корзины
    const closeBtns = document.querySelectorAll('.close-modal');
    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (typeof CartModule !== 'undefined') {
                CartModule.closeModal();
            }
        });
    });

    // Закрытие по клику на затемнение
    const modalOverlay = document.getElementById('cart-modal');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                if (typeof CartModule !== 'undefined') CartModule.closeModal();
            }
        });
    }

    // 3. Кнопки "В корзину" (делегирование событий)
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-add')) {
            const id = e.target.dataset.id;
            const name = e.target.dataset.name;
            const price = parseFloat(e.target.dataset.price);
            
            if (typeof CartModule !== 'undefined') {
                CartModule.add({ id, name, price });
                if (typeof ToastModule !== 'undefined') {
                    ToastModule.show('Товар добавлен в корзину', 'success');
                }
            }
        }
    });
}

/**
 * Обработка форм (Заявка и Заказ)
 */
function setupForms() {
    const contactForm = document.getElementById('contact-form');
    if (contactForm) contactForm.addEventListener('submit', handleContactSubmit);

    const orderForm = document.getElementById('order-form');
    if (orderForm) orderForm.addEventListener('submit', handleOrderSubmit);
}

/**
 * Загрузка каталога (если мы на странице каталога)
 */
function loadCatalogIfNeed() {
    const grid = document.getElementById('full-catalog'); // ИСПРАВЛЕНО ID
    const filters = document.getElementById('catalog-filters');

    // Проверяем, есть ли данные и нужен ли каталог
    if (grid && typeof CATALOG_DATA !== 'undefined' && typeof ProductsLoader !== 'undefined') {
        ProductsLoader.renderProducts(CATALOG_DATA, grid);
        if (filters) ProductsLoader.renderFilters(CATALOG_DATA, filters);
    }
}

// --- Обработчики отправки (Telegram) ---
async function handleContactSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form));
    
    const msg = `📩 <b>Заявка с сайта</b>\n👤 ${data.name}\n📞 ${data.phone}\n📝 ${data.message || data.email}`;
    await sendToTelegram(msg);
    alert('Сообщение отправлено!');
    form.reset();
}

async function handleOrderSubmit(e) {
    e.preventDefault();
    if (typeof CartModule === 'undefined' || CartModule.getItems().length === 0) return alert('Корзина пуста');

    const form = e.target;
    const data = Object.fromEntries(new FormData(form));
    const items = CartModule.getItems();
    const total = Utils.formatPrice(CartModule.getTotal());
    
    let list = items.map(i => `▪️ ${i.name} x${i.qty} - ${Utils.formatPrice(i.price * i.qty)}`).join('\n');
    const msg = `🛒 <b>НОВЫЙ ЗАКАЗ!</b>\n👤 ${data.name}\n📞 ${data.phone}\n📍 ${data.address || '-'}\n\n${list}\n💰 <b>Итого: ${total}</b>`;
    
    await sendToTelegram(msg);
    alert('Заказ оформлен!');
    CartModule.clear();
    form.reset();
    if (typeof CartModule !== 'undefined') CartModule.closeModal();
}

async function sendToTelegram(text) {
    const cfg = APP_CONFIG.telegram;
    if (!cfg.token || cfg.token === 'ВАШ_ТОКЕН_БОТА') {
        console.log('Демо режим (Telegram не настроен):', text);
        return;
    }
    try {
        await fetch(`https://api.telegram.org/bot${cfg.token}/sendMessage`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ chat_id: cfg.chatId, text, parse_mode: 'HTML' })
        });
    } catch (err) { console.error(err); }
}