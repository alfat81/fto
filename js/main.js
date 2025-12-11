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

// Меню каталога
document.addEventListener('DOMContentLoaded', function() {
    const catalogBtn = document.querySelector('.catalog-btn');
    const catalogMenu = document.querySelector('.catalog-menu');
    const catalogLinks = document.querySelectorAll('.catalog-link');
    const navLinks = document.querySelectorAll('.nav-btn');
    
    // Показ/скрытие меню каталога
    catalogBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        catalogMenu.classList.toggle('visible');
    });
    
    // Закрытие меню при клике вне его
    document.addEventListener('click', function(e) {
        if (!catalogMenu.contains(e.target) && e.target !== catalogBtn) {
            catalogMenu.classList.remove('visible');
        }
    });
    
    // Закрытие меню при прокрутке
    window.addEventListener('scroll', function() {
        catalogMenu.classList.remove('visible');
    });
    
    // Активный пункт меню
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Активные ссылки каталога
    catalogLinks.forEach(link => {
        if (window.location.href.includes(link.getAttribute('href'))) {
            link.classList.add('active');
        }
    });
    
    // Загрузка изображений с отложенной загрузкой
    const lazyImages = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });
    
    lazyImages.forEach(img => {
        imageObserver.observe(img);
    });
    
    console.log('Сайт инициализирован! Загрузите изображения в папку images/');
});
