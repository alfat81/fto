/**
 * header.js - Генерация шапки и логика поиска (Phase 2)
 *
 * Изменения:
 * - Меню расширено: добавлены «Услуги» и «Проекты»
 * - Кнопка «Заказать звонок» в шапке (модальное окно)
 * - Поиск пока только на странице каталога
 */

const headerHTML = `
<header class="site-header">
    <div class="container header-content">
        <!-- Логотип -->
        <div class="logo">
            <a href="index.html">
                <h1>ФТО</h1>
                <span>Фабрика торгового оборудования</span>
            </a>
        </div>

        <!-- Навигация -->
        <nav class="main-nav">
            <ul>
                <li><a href="index.html" data-page="index">Главная</a></li>
                <li><a href="catalog.html" data-page="catalog">Каталог</a></li>
                <li><a href="services.html" data-page="services">Услуги</a></li>
                <li><a href="cases.html" data-page="cases">Проекты</a></li>
                <li><a href="about.html" data-page="about">О фабрике</a></li>
                <li><a href="contacts.html" data-page="contacts">Контакты</a></li>
            </ul>
        </nav>

        <!-- Действия -->
        <div class="header-actions">
            <a href="tel:+79601786738" class="header-phone">
                <i class="fas fa-phone-alt"></i>
                <span>+7 (960) 178-67-38</span>
            </a>

            <!-- КОРЗИНА -->
            <div class="cart-btn-wrapper" id="cart-trigger" title="Корзина">
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

// 2. Поиск в шапке (только на странице каталога — иначе редирект с параметром)
// Убрано: пользователь нажимает Enter → переход на catalog.html?search=...
// Реализация рабочего поиска отложена на Phase 3 (нужен серверный поиск или lunr.js)

// 3. Открытие корзины
const cartTrigger = document.getElementById('cart-trigger');
if (cartTrigger) {
    cartTrigger.addEventListener('click', () => {
        if (typeof CartModule !== 'undefined') {
            CartModule.openModal();
        }
    });
}

// 4. Мобильное меню (drawer)
const mobileToggle = document.querySelector('.mobile-menu-toggle');
const mainNav = document.querySelector('.main-nav');
if (mobileToggle && mainNav) {
    mobileToggle.addEventListener('click', () => {
        mainNav.classList.toggle('mobile-open');
        mobileToggle.classList.toggle('active');
    });
    // Закрытие меню при клике на пункт
    mainNav.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
            mainNav.classList.remove('mobile-open');
            mobileToggle.classList.remove('active');
        });
    });
}
