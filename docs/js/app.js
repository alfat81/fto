/**
 * app.js - Точка входа
 */
document.addEventListener('DOMContentLoaded', () => {
    if (typeof CartModule !== 'undefined') CartModule.init();
    if (typeof ToastModule !== 'undefined') ToastModule.init();
    
    // Запуск каталога, если есть контейнер catalog-grid
    if (document.getElementById('catalog-grid') && typeof ProductsLoader !== 'undefined') {
        ProductsLoader.loadCatalog();
    }
    
    // Глобальные клики (делегирование)
    document.addEventListener('click', (e) => {
        // Кнопка "В корзину"
        if (e.target.classList.contains('btn-add')) {
            const { id, name, price } = e.target.dataset;
            if (typeof CartModule !== 'undefined') {
                CartModule.add({ id, name: name, price: parseFloat(price) });
                if (typeof ToastModule !== 'undefined') ToastModule.show('Товар добавлен', 'success');
            }
        }
        
        // Закрытие модалки по клику на затемнение
        if (e.target.id === 'cart-modal') {
            if (typeof CartModule !== 'undefined') CartModule.closeModal();
        }
    });
    
    // Крестик закрытия
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            if (typeof CartModule !== 'undefined') CartModule.closeModal();
        });
    });
    
    // Формы
    const contactForm = document.getElementById('contact-form');
    if (contactForm) contactForm.addEventListener('submit', handleContactSubmit);
    const orderForm = document.getElementById('order-form');
    if (orderForm) orderForm.addEventListener('submit', handleOrderSubmit);
});

async function handleContactSubmit(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    const msg = `📩 Заявка с сайта\n👤 ${data.name}\n📞 ${data.phone}\n✉️ ${data.email}\n💬 ${data.message}`;
    await sendToTelegram(msg);
    alert('Сообщение отправлено!');
    e.target.reset();
}

async function handleOrderSubmit(e) {
    e.preventDefault();
    if (typeof CartModule === 'undefined' || CartModule.getItems().length === 0) return alert('Корзина пуста');
    
    const data = Object.fromEntries(new FormData(e.target));
    const items = CartModule.getItems().map(i => `▪️ ${i.name} x${i.qty} - ${Utils.formatPrice(i.price*i.qty)}`).join('\n');
    const msg = `🛒 НОВЫЙ ЗАКАЗ\n👤 ${data.name}\n📞 ${data.phone}\n📍 ${data.address || '-'}\n\n${items}\n💰 Итого: ${Utils.formatPrice(CartModule.getTotal())}`;
    
    await sendToTelegram(msg);
    alert('Заказ оформлен!');
    CartModule.clear();
    e.target.reset();
    CartModule.closeModal();
}

async function sendToTelegram(text) {
    const { token, chatId } = APP_CONFIG.telegram;
    if (!token || token === 'ВАШ_ТОКЕН_БОТА') return console.log('Демо отправка:', text);
    try {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
        });
    } catch (err) { console.error(err); }
}