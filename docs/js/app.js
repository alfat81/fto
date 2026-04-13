/**
 * app.js
 * Главный файл приложения (Serverless версия).
 * Отправляет данные форм напрямую в Telegram API.
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log(`🚀 ${APP_CONFIG.app.name} v${APP_CONFIG.app.version} запущен`);
    
    // Проверка настроек
    if (APP_CONFIG.telegram.token === 'ВАШ_ТОКЕН_БОТА' || APP_CONFIG.telegram.chatId === 'ВАШ_CHAT_ID') {
        console.warn('⚠️ ВНИМАНИЕ: Не настроены Telegram токен или Chat ID в config.js! Заявки не будут приходить.');
        ToastModule.warning('Сайт работает в демо-режиме (нет настроек Telegram)');
    }

    ToastModule.init();
    CartModule.load();

    setupForms();
    setupEventListeners();
});

function setupForms() {
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }

    const orderForm = document.getElementById('order-form');
    if (orderForm) {
        orderForm.addEventListener('submit', handleOrderSubmit);
    }
}

function setupEventListeners() {
    // Кнопки "Купить"
    document.querySelectorAll('.btn-add-to-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const card = btn.closest('.product-card') || btn.closest('.card');
            if (!card) return;

            const product = {
                id: card.dataset.id || Utils.generateId(),
                name: card.dataset.name || card.querySelector('.product-title')?.textContent || 'Товар',
                price: parseFloat(card.dataset.price) || 0,
                image: card.dataset.image || ''
            };

            CartModule.add(product);
        });
    });

    // Модальные окна
    document.querySelectorAll('[data-toggle="cart-modal"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const modalId = btn.getAttribute('href') || '#cart-modal';
            const modal = document.querySelector(modalId);
            if (modal) {
                modal.style.display = 'block';
                CartModule.updateUI();
            }
        });
    });

    document.querySelectorAll('.close-modal, .modal-overlay').forEach(el => {
        el.addEventListener('click', (e) => {
            if (e.target === el || el.classList.contains('close-modal')) {
                const modal = el.closest('.modal');
                if (modal) modal.style.display = 'none';
            }
        });
    });
}

/**
 * Отправка формы контактов в Telegram
 */
async function handleContactSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    if (!Utils.isValidEmail(data.email)) {
        ToastModule.error('Введите корректный Email');
        return;
    }
    if (!Utils.isValidPhone(data.phone)) {
        ToastModule.error('Введите корректный телефон');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Отправка...';

    const message = `
📩 <b>Заявка с сайта (Контакты)</b>
👤 <b>Имя:</b> ${Utils.sanitizeInput(data.name)}
📞 <b>Телефон:</b> ${Utils.sanitizeInput(data.phone)}
✉️ <b>Email:</b> ${Utils.sanitizeInput(data.email)}
💬 <b>Сообщение:</b> ${Utils.sanitizeInput(data.message)}
    `;

    await sendToTelegram(message);

    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
    form.reset();
}

/**
 * Отправка заказа в Telegram
 */
async function handleOrderSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const items = CartModule.getItems();

    if (items.length === 0) {
        ToastModule.error('Корзина пуста!');
        return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    if (!Utils.isValidPhone(data.phone)) {
        ToastModule.error('Введите корректный телефон');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Оформление...';

    let itemsList = items.map(item => 
        `▪️ ${item.name} x${item.quantity} = ${Utils.formatCurrency(item.price * item.quantity)}`
    ).join('\n');

    const message = `
🛒 <b>НОВЫЙ ЗАКАЗ!</b>
👤 <b>Клиент:</b> ${Utils.sanitizeInput(data.name) || 'Аноним'}
📞 <b>Телефон:</b> ${Utils.sanitizeInput(data.phone)}
📍 <b>Адрес:</b> ${Utils.sanitizeInput(data.address) || 'Не указан'}

<b>Состав заказа:</b>
${itemsList}

💰 <b>ИТОГО:</b> ${Utils.formatCurrency(CartModule.getTotal())}
    `;

    const success = await sendToTelegram(message);

    submitBtn.disabled = false;
    submitBtn.textContent = originalText;

    if (success) {
        ToastModule.success('Заказ успешно отправлен! Мы свяжемся с вами.');
        CartModule.clear();
        document.querySelector('.modal').style.display = 'none';
        form.reset();
    } else {
        ToastModule.error('Ошибка отправки. Позвоните нам по телефону.');
    }
}

/**
 * Универсальная функция отправки в Telegram
 */
async function sendToTelegram(text) {
    const { token, chatId } = APP_CONFIG.telegram;

    if (token === 'ВАШ_ТОКЕН_БОТА' || chatId === 'ВАШ_CHAT_ID') {
        alert('ОШИБКА НАСТРОЙКИ: Владелец сайта не указал токен бота в config.js');
        console.log('Сообщение для отправки:', text);
        return false;
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: 'HTML'
            })
        });

        const result = await response.json();
        
        if (result.ok) {
            return true;
        } else {
            console.error('Telegram API Error:', result);
            ToastModule.error('Ошибка Telegram: ' + result.description);
            return false;
        }
    } catch (error) {
        console.error('Network Error:', error);
        ToastModule.error('Нет соединения с интернетом');
        return false;
    }
}