document.addEventListener('DOMContentLoaded', () => {
    console.log('FTO App Initialized');
    
    // 1. Инициализация загрузчика товаров (если мы на странице каталога)
    ProductsLoader.loadCatalog();

    // 2. Настройка форм
    setupForms();
    
    // 3. Глобальные слушатели (модальные окна)
    setupModals();
});

function setupForms() {
    // Форма контактов
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }

    // Форма заказа
    const orderForm = document.getElementById('order-form');
    if (orderForm) {
        orderForm.addEventListener('submit', handleOrderSubmit);
    }
}

function setupModals() {
    // Открытие корзины
    document.querySelectorAll('[data-toggle="cart-modal"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(btn.getAttribute('href') || '#cart-modal');
            if (target) {
                target.style.display = 'block';
                CartModule.updateUI(); // Обновить список при открытии
            }
        });
    });

    // Закрытие по крестику или клику вне окна
    document.querySelectorAll('.close-modal').forEach(el => {
        el.addEventListener('click', () => {
            el.closest('.modal').style.display = 'none';
        });
    });
    
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}

async function sendToTelegram(text) {
    const { botToken, chatId } = APP_CONFIG.telegram;
    if (!botToken || !chatId) {
        console.warn('Telegram не настроен (нет токена или ID)');
        ToastModule.warning('Режим демонстрации: заявка не отправлена (нет настроек TG)');
        return false;
    }

    const url = `${APP_CONFIG.api.telegramUrl}${botToken}/sendMessage`;
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
        return res.ok;
    } catch (e) {
        console.error('TG Error:', e);
        return false;
    }
}

async function handleContactSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    const data = new FormData(form);
    
    if (!Utils.isValidPhone(data.get('phone'))) {
        ToastModule.error('Неверный формат телефона');
        return;
    }

    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Отправка...';

    const text = `
📩 <b>Заявка с сайта (Контакты)</b>
👤 Имя: ${data.get('name')}
📞 Телефон: ${data.get('phone')}
✉️ Email: ${data.get('email')}
💬 Сообщение: ${data.get('message')}
    `;

    const success = await sendToTelegram(text);
    
    if (success) {
        ToastModule.success('Сообщение отправлено!');
        form.reset();
    } else {
        ToastModule.error('Ошибка отправки. Попробуйте позже.');
    }

    btn.disabled = false;
    btn.textContent = originalText;
}

async function handleOrderSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const items = CartModule.getItems();
    
    if (items.length === 0) {
        ToastModule.error('Корзина пуста!');
        return;
    }

    const btn = form.querySelector('button[type="submit"]');
    const data = new FormData(form);

    if (!Utils.isValidPhone(data.get('phone'))) {
        ToastModule.error('Неверный формат телефона');
        return;
    }

    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Обработка...';

    let itemsList = items.map(i => `▪️ ${i.name} x${i.quantity} - ${Utils.formatCurrency(i.price * i.quantity)}`).join('\n');
    const total = CartModule.getTotal();

    const text = `
🛒 <b>НОВЫЙ ЗАКАЗ!</b>
👤 Клиент: ${data.get('name') || 'Аноним'}
📞 Телефон: ${data.get('phone')}
📍 Адрес: ${data.get('address') || 'Не указан'}

<b>Состав:</b>
${itemsList}

💰 <b>Итого: ${Utils.formatCurrency(total)}</b>
    `;

    const success = await sendToTelegram(text);

    if (success) {
        ToastModule.success('Заказ успешно оформлен!');
        CartModule.clear();
        form.reset();
        document.querySelector('.modal').style.display = 'none';
    } else {
        ToastModule.error('Ошибка оформления заказа.');
    }

    btn.disabled = false;
    btn.textContent = originalText;
}