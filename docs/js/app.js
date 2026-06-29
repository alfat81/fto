/**
 * app.js — Точка входа (Phase 2)
 *
 * Изменения:
 * - Telegram полностью убран (заблокирован в России)
 * - Уведомления отправляются на email через backend-прокси (nodemailer + SMTP)
 * - Добавлена поддержка формы расчёта стоимости (lead-calc-form)
 * - alert() заменён на toast-уведомления
 * - Закрытие модалок по Escape
 * - Проверка чекбокса согласия перед отправкой
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

    // Подключаем все формы
    const contactForm = document.getElementById('contact-form');
    if (contactForm) contactForm.addEventListener('submit', handleContactSubmit);

    const orderForm = document.getElementById('order-form');
    if (orderForm) orderForm.addEventListener('submit', handleOrderSubmit);

    const leadForm = document.getElementById('lead-calc-form');
    if (leadForm) leadForm.addEventListener('submit', handleLeadSubmit);
});

/**
 * Проверка чекбокса согласия на ПДн.
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

/**
 * Форма контактов (contacts.html)
 */
async function handleContactSubmit(e) {
    e.preventDefault();
    const form = e.target;
    if (!checkConsent(form)) return;

    const data = Object.fromEntries(new FormData(form));
    const emailBody = buildContactEmail(data);

    if (typeof ToastModule !== 'undefined') ToastModule.show('Отправляем сообщение...', 'info');
    const result = await sendToEmail('📨 Новое сообщение с сайта ФТО', emailBody);

    if (result.ok) {
        if (typeof ToastModule !== 'undefined') ToastModule.show('Сообщение отправлено! Ответим в течение 1 рабочего дня.', 'success');
        form.reset();
    } else {
        if (typeof ToastModule !== 'undefined') {
            ToastModule.show(`Не удалось отправить: ${result.error}. Позвоните +7 (960) 178-67-38`, 'error');
        }
    }
}

/**
 * Форма заказа из корзины
 */
async function handleOrderSubmit(e) {
    e.preventDefault();
    const form = e.target;
    if (!checkConsent(form)) return;

    if (typeof CartModule === 'undefined' || CartModule.getItems().length === 0) {
        if (typeof ToastModule !== 'undefined') ToastModule.show('Корзина пуста', 'warning');
        return;
    }

    const data = Object.fromEntries(new FormData(form));
    const emailBody = buildOrderEmail(data, CartModule.getItems(), CartModule.getTotal());

    if (typeof ToastModule !== 'undefined') ToastModule.show('Оформляем заказ...', 'info');
    const result = await sendToEmail('🛒 НОВЫЙ ЗАКАЗ с сайта ФТО', emailBody);

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
 * Форма расчёта стоимости (на главной странице)
 */
async function handleLeadSubmit(e) {
    e.preventDefault();
    const form = e.target;
    if (!checkConsent(form)) return;

    const data = Object.fromEntries(new FormData(form));
    const emailBody = buildLeadEmail(data);

    if (typeof ToastModule !== 'undefined') ToastModule.show('Отправляем заявку...', 'info');
    const result = await sendToEmail('📋 ЗАЯВКА НА РАСЧЁТ СТОИМОСТИ', emailBody);

    if (result.ok) {
        if (typeof ToastModule !== 'undefined') ToastModule.show('Заявка отправлена! Технолог свяжется в течение 30 минут.', 'success');
        form.reset();
    } else {
        if (typeof ToastModule !== 'undefined') {
            ToastModule.show(`Ошибка отправки: ${result.error}. Позвоните +7 (960) 178-67-38`, 'error');
        }
    }
}

// ━━ Шаблоны писем ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function buildContactEmail(d) {
    return `
НОВОЕ СООБЩЕНИЕ С САЙТА ФТО
============================

Имя: ${d.name || '-'}
Телефон: ${d.phone || '-'}
Email: ${d.email || '-'}

Сообщение:
${d.message || '-'}

-------------------
Отправлено: ${new Date().toLocaleString('ru-RU')}
Страница: contacts.html
`.trim();
}

function buildOrderEmail(d, items, total) {
    const itemsList = items.map(i =>
        `  • ${i.name} × ${i.qty} = ${Utils.formatPrice(i.price * i.qty)}`
    ).join('\n');
    return `
НОВЫЙ ЗАКАЗ С САЙТА ФТО
========================

Имя: ${d.name || '-'}
Телефон: ${d.phone || '-'}
Адрес доставки: ${d.address || '-'}

ТОВАРЫ:
${itemsList}

ИТОГО: ${Utils.formatPrice(total)}

-------------------
Отправлено: ${new Date().toLocaleString('ru-RU')}
Страница: заказ из корзины
`.trim();
}

function buildLeadEmail(d) {
    return `
ЗАЯВКА НА РАСЧЁТ СТОИМОСТИ
==========================

Имя: ${d.name || '-'}
Телефон: ${d.phone || '-'}
Email: ${d.email || '-'}

Тип объекта: ${d.object_type || '-'}
Площадь: ${d.area ? d.area + ' м²' : 'не указана'}
Город: ${d.city || '-'}

Комментарий:
${d.comment || '-'}

-------------------
Отправлено: ${new Date().toLocaleString('ru-RU')}
Страница: главная (форма расчёта)
`.trim();
}

// ━━ Отправка через backend (email) ━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Отправка email через backend-прокси.
 *
 * Backend endpoint: POST /api/send  body: { subject, text }
 * Backend использует nodemailer + SMTP Mail.ru для отправки на alfat@list.ru.
 */
async function sendToEmail(subject, text) {
    const backendUrl = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.backend && APP_CONFIG.backend.url)
        ? APP_CONFIG.backend.url
        : '';

    if (!backendUrl) {
        console.warn('[FTO] Backend URL не настроен в APP_CONFIG.backend.url. Письмо не отправлено.');
        return {
            ok: false,
            error: 'форма обратной связи не настроена'
        };
    }

    try {
        const resp = await fetch(`${backendUrl}/api/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subject, text })
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
