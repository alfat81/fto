/**
 * header.js - Единая шапка для всех страниц
 */

const headerHTML = `
<header>
    <div class="container header-container">
        <a href="index.html" class="logo">
            <strong>ФТО</strong>
            <span>Фабрика Торгового Оборудования</span>
        </a>
        <nav class="nav-buttons">
            <a href="index.html" class="nav-btn" data-page="index">Главная</a>
            <a href="catalog.html" class="nav-btn" data-page="catalog">Каталог</a>
            <a href="about.html" class="nav-btn" data-page="about">О нас</a>
            <a href="contacts.html" class="nav-btn" data-page="contacts">Контакты</a>
            <a href="#" class="nav-btn" id="cart-btn">
                <i class="fas fa-shopping-cart"></i>
                Корзина
                <span id="cart-count">0</span>
            </a>
        </nav>
    </div>
</header>

<!-- Cart Modal -->
<div id="cart-modal" class="modal">
    <div class="modal-content">
        <span class="close">&times;</span>
        <h2>Ваша корзина</h2>
        <div id="cart-items"></div>
        <div class="cart-total">
            <span>Итого:</span>
            <span id="cart-total">0 ₽</span>
        </div>
        <form id="checkout-form" class="cart-form">
            <input type="text" id="name" name="name" placeholder="Ваше имя*" required>
            <input type="tel" id="phone" name="phone" placeholder="Ваш телефон*" required>
            <textarea id="comment" name="comment" placeholder="Комментарий к заказу" rows="3"></textarea>
            <button type="submit" id="checkout-btn" disabled>Оформить заказ</button>
        </form>
    </div>
</div>
`;

// Добавляем Font Awesome
const fontAwesomeLink = document.createElement('link');
fontAwesomeLink.rel = 'stylesheet';
fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
document.head.appendChild(fontAwesomeLink);

// Вставляем шапку в начало body
document.body.insertAdjacentHTML('afterbegin', headerHTML);

// Активируем кнопку для текущей страницы
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
const pageName = currentPage.replace('.html', '');
const activeBtn = document.querySelector(`.nav-btn[data-page="${pageName}"]`);
if (activeBtn) {
    activeBtn.classList.add('active');
}

// Обновляем счётчик корзины
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const countEl = document.getElementById('cart-count');
    if (countEl) {
        countEl.textContent = count;
        countEl.style.display = count > 0 ? 'inline-block' : 'none';
    }
}

// Инициализация
updateCartCount();

// Экспортируем функцию для использования в других модулях
window.updateCartCount = updateCartCount;
