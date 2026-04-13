/**
 * app.js
 * Главный файл инициализации приложения.
 * Исправлена логика открытия модальных окон.
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log(`🚀 ${APP_CONFIG.app.name} v${APP_CONFIG.app.version} запущен`);
    
    // Инициализация модулей
    if (typeof ToastModule !== 'undefined') ToastModule.init();
    if (typeof CartModule !== 'undefined') CartModule.load();

    setupEventListeners();
    setupForms();
});

/**
 * Настройка глобальных слушателей событий
 */
function setupEventListeners() {
    // 1. Кнопки "Купить"
    document.querySelectorAll('.btn-add-to-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const card = btn.closest('.product-card') || btn.closest('.card');
            if (!card) return;

            const product = {
                id: card.dataset.id || 'temp_' + Date.now(),
                name: card.dataset.name || card.querySelector('.product-title')?.textContent?.trim() || 'Товар',
                price: parseFloat(card.dataset.price) || 0,
                image: card.dataset.image || ''
            };

            if (typeof CartModule !== 'undefined') {
                CartModule.add(product);
            } else {
                alert('Ошибка: Модуль корзины не загружен');
            }
        });
    });

    // 2. Открытие корзины (ИСПРАВЛЕНО)
    // Ищем все элементы, которые должны открывать корзину
    const cartTriggers = document.querySelectorAll('[data-toggle="cart-modal"], .open-cart-btn, a[href="#cart-modal"]');
    
    cartTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation(); // Останавливаем всплытие
            
            const modal = document.getElementById('cart-modal');
            if (modal) {
                // Принудительно показываем модальное окно
                modal.style.display = 'block';
                // Небольшая задержка для обновления контента внутри модалки
                setTimeout(() => {
                    if (typeof CartModule !== 'undefined') CartModule.updateUI();
                }, 10);
                
                // Добавляем класс для анимации (если есть в CSS)
                modal.classList.add('modal-open');
            } else {
                console.error('Модальное окно #cart-modal не найдено в DOM');
            }
        });
    });

    // 3. Закрытие модальных окон
    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
                modal.classList.remove('modal-open');
            }
        });
    });

    // Закрытие по клику вне контента (на затемнение)
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
            e.target.classList.remove('modal-open');
        }
    });
}

/**
 * Настройка форм
 */
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

async function handleContactSubmit(e) {
    e.preventDefault();
    // ... (код отправки формы остался без изменений)
    alert('Функция отправки формы контактов будет реализована после настройки Telegram API');
}

async function handleOrderSubmit(e) {
    e.preventDefault();
    const form = e.target;
    
    if (typeof CartModule === 'undefined' || CartModule.getItems().length === 0) {
        alert('Ваша корзина пуста!');
        return;
    }

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    if (!data.phone) {
        alert('Пожалуйста, укажите телефон');
        return;
    }

    // Формирование сообщения для Telegram
    const items = CartModule.getItems();
    let itemsList = items.map(i => `${i.name} x${i.quantity} - ${i.price * i.quantity} ₽`).join('\n');
    const total = CartModule.getTotal();
    
    const message = `
🛒 <b>НОВЫЙ ЗАКАЗ</b>
👤 Имя: ${data.name || 'Не указано'}
📞 Телефон: ${data.phone}
📍 Адрес: ${data.address || 'Самовывоз'}

📦 <b>Товары:</b>
${itemsList}

💰 <b>Итого: ${total} ₽</b>
    `;

    // Отправка в Telegram напрямую
    await sendToTelegram(message);

    CartModule.clear();
    form.reset();
    document.getElementById('cart-modal').style.display = 'none';
    alert('Заказ успешно оформлен! Мы свяжемся с вами.');
}

/**
 * Прямая отправка в Telegram (без бэкенда)
 */
async function sendToTelegram(text) {
    const token = APP_CONFIG.telegram.token;
    const chatId = APP_CONFIG.telegram.chatId;

    if (!token || !chatId) {
        console.error('Ошибка: Не настроен Telegram (токен или chatId)');
        return;
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

        if (!response.ok) {
            throw new Error(`Telegram API error: ${response.status}`);
        }
        console.log('Заказ отправлен в Telegram');
    } catch (error) {
        console.error('Ошибка отправки:', error);
        alert('Произошла ошибка при отправке заказа. Попробуйте позвонить нам.');
    }
}