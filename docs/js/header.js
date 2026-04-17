/**
 * header.js - Генерация шапки и логика поиска
 */

const headerHTML = `
<header class="site-header">
    <div class="container header-content">
        <!-- Логотип -->
        <div class="logo">
            <a href="index.html">
                <h1>ФТО</h1>
                <span>Фабрика Торгового Оборудования</span>
            </a>
        </div>

        <!-- Навигация -->
        <nav class="main-nav">
            <ul>
                <li><a href="index.html" data-page="index">Главная</a></li>
                <li><a href="catalog.html" data-page="catalog">Каталог</a></li>
                <li><a href="about.html" data-page="about">О компании</a></li>
                <li><a href="contacts.html" data-page="contacts">Контакты</a></li>
            </ul>
        </nav>

        <!-- Действия: Поиск + Корзина -->
        <div class="header-actions">
            
            <!-- ПОИСК -->
            <div class="search-wrapper">
                <i class="fas fa-search"></i>
                <input type="text" id="site-search-input" placeholder="Поиск товаров...">
            </div>

            <!-- КОРЗИНА -->
            <div class="cart-btn-wrapper" id="cart-trigger">
                <i class="fas fa-shopping-cart"></i>
                <span class="cart-text">Корзина</span>
                <span class="cart-badge" id="cart-count">0</span>
            </div>
            
            <div class="mobile-menu-toggle"><i class="fas fa-bars"></i></div>
        </div>
    </div>
</header>`;

// Вставляем шапку в начало body
document.body.insertAdjacentHTML('afterbegin', headerHTML);

// 1. Подсветка активного пункта меню
const currentPath = window.location.pathname.split('/').pop() || 'index.html';
const activePage = currentPath.replace('.html', '');
document.querySelectorAll('.main-nav a').forEach(link => {
    if (link.dataset.page === activePage) link.classList.add('active');
});

// 2. Логика поиска (по нажатию Enter)
const searchInput = document.getElementById('site-search-input');
if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) {
                // Переход в каталог с параметром поиска
                window.location.href = `catalog.html?search=${encodeURIComponent(query)}`;
            }
        }
    });
}

// 3. Открытие корзины
const cartTrigger = document.getElementById('cart-trigger');
if (cartTrigger) {
    cartTrigger.addEventListener('click', () => {
        if (typeof CartModule !== 'undefined') {
            CartModule.openModal();
        }
    });
}