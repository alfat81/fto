/**
 * app.js - Точка входа (Phase 1 — обновлено)
 *
 * Изменения Phase 1:
 * - alert() заменён на ToastModule.show() для всех уведомлений
 * - sendToTelegram() теперь идёт через backend-прокси (/api/send)
 * - Если бэкенд недоступен или токен пустой — честное сообщение об ошибке,
 *   а НЕ ложное «Заказ оформлен!»
 * - Добавлена проверка чекбокса согласия перед отправкой
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
                if (typeof ToastModule !== 'undefined') ToastModule.show('Товар добавлен в корзину', 'success');
            }
        }

        // Закрытие модалки по клику на затемнение
        if (e.target.id === 'cart-modal') {
            if (typeof CartModule !== 'undefined') CartModule.closeModal();
        }
        if (e.target.id === 'product-modal') {
            if (typeof ProductsLoader !== 'undefined' && typeof closeProductModal === 'function') closeProductModal();
        }
    });

    // Крестик закрытия
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            if (typeof CartModule !== 'undefined') CartModule.closeModal();
        });
    });

    // Закрытие модалок по Escape (a11y)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (typeof CartModule !== 'undefined') CartModule.closeModal();
            if (typeof ProductsLoader !== 'undefined' && typeof closeProductModal === 'function') closeProductModal();
        }
    });

    // Формы
    const contactForm = document.getElementById('contact-form');
    if (contactForm) contactForm.addEventListener('submit', handleContactSubmit);
    const orderForm = document.getElementById('order-form');
    if (orderForm) orderForm.addEventListener('submit', handleOrderSubmit);
});

/**
 * Проверка согласия на обработку ПДн.
 * Возвращает true если чекбокс установлен, иначе показывает toast и возвращает false.
 */
function checkConsent(form) {
    const consent = form.querySelector('input[name="consent"]');
    if (consent && !consent.checked) {
        if (typeof ToastModule !== 'undefined') {
            ToastModule.show('Необходимо согласие на обработку персональных данных', 'error');
        }
        consent.focus();
        return false;
    }
    return true;
}

async function handleContactSubmit(e) {
    e.preventDefault();
    const form = e.target;
    if (!checkConsent(form)) return;

    const data = Object.fromEntries(new FormData(form));
    const msg = `📩 Заявка с сайта\n👤 ${data.name}\n📞 ${data.phone}\n✉️ ${data.email || '-'}\n💬 ${data.message || '-'}`;

    if (typeof ToastModule !== 'undefined') ToastModule.show('Отправляем сообщение...', 'info');
    const result = await sendToTelegram(msg);

    if (result.ok) {
        if (typeof ToastModule !== 'undefined') ToastModule.show('Сообщение отправлено! Мы свяжемся с вами в ближайшее время.', 'success');
        form.reset();
    } else {
        if (typeof ToastModule !== 'undefined') {
            ToastModule.show(`Не удалось отправить: ${result.error}. Позвоните нам +7 (960) 178-67-38`, 'error');
        }
    }
}

async function handleOrderSubmit(e) {
    e.preventDefault();
    const form = e.target;
    if (!checkConsent(form)) return;

    if (typeof CartModule === 'undefined' || CartModule.getItems().length === 0) {
        if (typeof ToastModule !== 'undefined') ToastModule.show('Корзина пуста', 'warning');
        return;
    }

    const data = Object.fromEntries(new FormData(form));
    const items = CartModule.getItems().map(i => `▪️ ${i.name} x${i.qty} - ${Utils.formatPrice(i.price*i.qty)}`).join('\n');
    const msg = `🛒 НОВЫЙ ЗАКАЗ\n👤 ${data.name}\n📞 ${data.phone}\n📍 ${data.address || '-'}\n\n${items}\n💰 Итого: ${Utils.formatPrice(CartModule.getTotal())}`;

    if (typeof ToastModule !== 'undefined') ToastModule.show('Оформляем заказ...', 'info');
    const result = await sendToTelegram(msg);

    if (result.ok) {
        if (typeof ToastModule !== 'undefined') ToastModule.show('Заказ оформлен! Менеджер свяжется с вами в течение рабочего дня.', 'success');
        CartModule.clear();
        form.reset();
        CartModule.closeModal();
    } else {
        if (typeof ToastModule !== 'undefined') {
            ToastModule.show(`Ошибка оформления: ${result.error}. Позвоните +7 (960) 178-67-38`, 'error');
        }
    }
}

/**
 * Отправка сообщения через backend-прокси (без раскрытия Telegram-токена).
 *
 * Backend endpoint: POST /api/send  body: { text: "..." }
 * Backend читает TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID из env и проксирует запрос.
 *
 * Если backend не настроен (APP_CONFIG.backendUrl пустой) — возвращает честную ошибку,
 * а НЕ отправляет запрос напрямую в Telegram (токен не должен быть в front-end коде).
 */
async function sendToTelegram(text) {
    const backendUrl = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.backend && APP_CONFIG.backend.url)
        ? APP_CONFIG.backend.url
        : '';

    // Если backend не настроен — честная ошибка, никаких ложных «Заказ оформлен!»
    if (!backendUrl) {
        console.warn('[FTO] Backend URL не настроен в APP_CONFIG.backend.url. Заказ не отправлен.');
        return {
            ok: false,
            error: 'форма обратной связи не настроена'
        };
    }

    try {
        const resp = await fetch(`${backendUrl}/api/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        if (!resp.ok) {
            const errData = await resp.json().catch(() => ({}));
            return { ok: false, error: errData.error || `HTTP ${resp.status}` };
        }
        return { ok: true };
    } catch (err) {
        console.error('[FTO] Backend request failed:', err);
        return { ok: false, error: 'сервер недоступен' };
    }
}
