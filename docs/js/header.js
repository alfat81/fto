/**
 * header.js - Динамическая вставка шапки
 */
const headerHTML = `
<header class="site-header">
    <div class="container header-content">
        <div class="logo">
            <a href="index.html"><h1>ФТО</h1><span>Фабрика Торгового Оборудования</span></a>
        </div>
        <nav class="main-nav">
            <ul>
                <li><a href="index.html" data-page="index">Главная</a></li>
                <li><a href="catalog.html" data-page="catalog">Каталог</a></li>
                <li><a href="about.html" data-page="about">О компании</a></li>
                <li><a href="contacts.html" data-page="contacts">Контакты</a></li>
            </ul>
        </nav>
        <div class="header-actions">
            <div class="cart-btn-wrapper" id="cart-trigger">
                <i class="fas fa-shopping-cart"></i>
                <span class="cart-text">Корзина</span>
                <span class="cart-badge" id="cart-count">0</span>
            </div>
            <div class="mobile-menu-toggle"><i class="fas fa-bars"></i></div>
        </div>
    </div>
</header>`;

document.body.insertAdjacentHTML('afterbegin', headerHTML);

// Активный пункт меню
const currentPath = window.location.pathname.split('/').pop() || 'index.html';
const activePage = currentPath.replace('.html', '');
document.querySelectorAll('.main-nav a').forEach(link => {
    if (link.dataset.page === activePage) link.classList.add('active');
});

// Открытие корзины
document.getElementById('cart-trigger').addEventListener('click', () => {
    if (typeof CartModule !== 'undefined') CartModule.openModal();
});