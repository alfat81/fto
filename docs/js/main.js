// Плавная прокрутка
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            window.scrollTo({
                top: target.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    });
});

// Эффект при прокрутке для хедера
window.addEventListener('scroll', function() {
    const header = document.querySelector('header');
    if (window.scrollY > 100) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// Анимация появления элементов при прокрутке
const parallaxItems = document.querySelectorAll('.parallax-item');

function checkScroll() {
    parallaxItems.forEach(item => {
        const itemPosition = item.getBoundingClientRect().top;
        const screenPosition = window.innerHeight / 1.3;
        
        if (itemPosition < screenPosition) {
            item.classList.add('visible');
        }
    });
}

// Запуск анимации при загрузке страницы
window.addEventListener('load', function() {
    setTimeout(() => {
        document.querySelector('.hero-content').style.opacity = '1';
        document.querySelector('.hero-content').style.transform = 'translateY(0)';
    }, 300);
    
    checkScroll();
});

// Проверка при прокрутке
window.addEventListener('scroll', checkScroll);

// Проверка при изменении размера окна
window.addEventListener('resize', checkScroll);

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Активный пункт меню
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-btn');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && currentPath.includes(href.replace('.html', ''))) {
            link.classList.add('active');
        }
    });
});

console.log('Сайт успешно инициализирован!');
