// Функция для загрузки HTML компонентов
async function loadComponent(elementId, filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`Ошибка загрузки компонента ${filePath}: ${response.status}`);
        }
        const html = await response.text();
        document.getElementById(elementId).innerHTML = html;
        console.log(`✅ Компонент ${filePath} успешно загружен`);
    } catch (error) {
        console.error(`❌ Ошибка загрузки компонента ${filePath}:`, error);
        // Резервный вариант на случай ошибки
        if (elementId === 'header-container') {
            document.getElementById('header-container').innerHTML = `
                <div class="container header-container">
                    <a href="index.html" class="logo">Фабрика<span>Торгового</span>Оборудования</a>
                    <div class="nav-buttons">
                        <a href="catalog.html" class="nav-btn">Каталог</a>
                        <a href="about.html" class="nav-btn">О компании</a>
                        <a href="contacts.html" class="nav-btn">Контакты</a>
                        <a href="#" class="nav-btn" id="cart-btn">
                            <i class="fas fa-shopping-cart"></i>
                            <span id="cart-count">0</span>
                        </a>
                    </div>
                </div>
            `;
        }
    }
}

// Функция инициализации навигации
function initNavigation() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-btn');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && currentPath.includes(href.replace('.html', ''))) {
            link.classList.add('active');
        }
    });
    
    // Обработчики кликов для навигации
    document.querySelectorAll('.nav-btn').forEach(link => {
        link.addEventListener('click', function(e) {
            // Убираем класс active со всех кнопок
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            // Добавляем класс active к текущей кнопке
            this.classList.add('active');
        });
    });
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Загрузка компонентов
    if (document.getElementById('header-container')) {
        loadComponent('header-container', 'components/header.html');
    }
    
    if (document.getElementById('cart-modal-container')) {
        loadComponent('cart-modal-container', 'components/cart-modal.html');
    }
    
    if (document.getElementById('footer-container')) {
        loadComponent('footer-container', 'components/footer.html');
    }
    
    // Инициализация навигации после загрузки компонентов
    setTimeout(initNavigation, 100);
    
    console.log('✅ Заголовок сайта успешно инициализирован');
});
