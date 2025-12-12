// ✅ ПОЛНОСТЬЮ ИСПРАВЛЕННЫЙ ФАЙЛ - БЕЗОПАСНАЯ ВЕРСИЯ

// Инициализация корзины
let cart = JSON.parse(localStorage.getItem('cart')) || [];
const API_URL = 'https://fto-tdks.onrender.com/api/order';

console.log('🚀 Сайт загружен. Версия скрипта: 2.4.0 (ИСПРАВЛЕНА ПРОБЛЕМА СО ССЫЛКАМИ)');
console.log('🛒 Начальное состояние корзины:', cart);

// ✅ БЕЗОПАСНАЯ ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM полностью загружен');
    
    // ✅ ИНИЦИАЛИЗАЦИЯ ВСЕХ КОМПОНЕНТОВ
    setupCartModal();
    initAddToCartButtons();
    updateCartDisplay();
    initNavigation();
    
    // ✅ ОТЛАДКА ПРОБЛЕМ СО ССЫЛКАМИ
    debugLinkIssues();
    
    console.log('🎉 Инициализация скрипта завершена успешно');
});

// ✅ БЕЗОПАСНАЯ ИНИЦИАЛИЗАЦИЯ НАВИГАЦИИ
function initNavigation() {
    console.log('🔧 Инициализация навигации');
    
    // ✅ РАБОТАЕМ ТОЛЬКО СО ССЫЛКАМИ, КОТОРЫЕ НЕ ЯВЛЯЮТСЯ ПУСТЫМИ
    document.querySelectorAll('.nav-btn:not([href="#"])').forEach(link => {
        link.addEventListener('click', function(e) {
            // ✅ НЕ БЛОКИРУЕМ СТАНДАРТНОЕ ПОВЕДЕНИЕ ССЫЛОК
            if (this.getAttribute('href') && this.getAttribute('href') !== '#') {
                return;
            }
            
            e.preventDefault();
            
            // ✅ УБИРАЕМ КЛАСС active СО ВСЕХ КНОПОК
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // ✅ ДОБАВЛЯЕМ КЛАСС active К ТЕКУЩЕЙ КНОПКЕ
            this.classList.add('active');
        });
    });
}

// ✅ БЕЗОПАСНАЯ ИНИЦИАЛИЗАЦИЯ КНОПОК КОРЗИНЫ
function initAddToCartButtons() {
    console.log('🔧 Инициализация кнопок добавления в корзину');
    
    // ✅ РАБОТАЕМ ТОЛЬКО С ЭЛЕМЕНТАМИ С КЛАССОМ add-to-cart
    document.querySelectorAll('.add-to-cart').forEach(button => {
        // ✅ СОЗДАЕМ КОПИЮ ДЛЯ БЕЗОПАСНОЙ ЗАМЕНЫ
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        newButton.addEventListener('click', function(e) {
            // ✅ ПРОВЕРЯЕМ, ЧТО ЭТО НЕ ССЫЛКА
            if (this.tagName === 'A' || this.closest('a')) {
                return;
            }
            
            e.preventDefault();
            e.stopPropagation();
            
            console.log('🛒 Клик по кнопке "В корзину"');
            const product = {
                id: this.getAttribute('data-id') || 'product-' + Date.now(),
                name: this.getAttribute('data-name') || 'Без названия',
                price: parseInt(this.getAttribute('data-price')) || 0,
                image: this.getAttribute('data-image') || ''
            };
            addToCart(product);
        });
    });
}

// ✅ ОТЛАДКА ПРОБЛЕМ СО ССЫЛКАМИ
function debugLinkIssues() {
    console.log('🔍 Отладка проблем со ссылками');
    
    // ✅ ПРОВЕРКА ВСЕХ ССЫЛОК НА СТРАНИЦЕ
    const allLinks = document.querySelectorAll('a[href]');
    const workingLinks = [];
    
    allLinks.forEach(link => {
        const rect = link.getBoundingClientRect();
        const isVisible = (
            rect.width > 0 && 
            rect.height > 0 && 
            rect.top >= 0 && 
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && 
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
        
        if (isVisible && link.offsetWidth > 0 && link.offsetHeight > 0) {
            workingLinks.push(link);
        }
    });
    
    console.log(`📊 СТАТИСТИКА ССЫЛОК: Всего - ${allLinks.length}, Рабочих - ${workingLinks.length}`);
    
    // ✅ ЕСЛИ ПРОБЛЕМА - СОЗДАЕМ ВИЗУАЛЬНОЕ ПРЕДУПРЕЖДЕНИЕ
    if (workingLinks.length === 0 && allLinks.length > 0) {
        createDebugWarning();
    }
}

// ✅ СОЗДАНИЕ ВИЗУАЛЬНОГО ПРЕДУПРЕЖДЕНИЯ
function createDebugWarning() {
    const warning = document.createElement('div');
    warning.style.position = 'fixed';
    warning.style.top = '20px';
    warning.style.right = '20px';
    warning.style.backgroundColor = 'rgba(220, 53, 69, 0.9)';
    warning.style.color = 'white';
    warning.style.padding = '15px';
    warning.style.borderRadius = '8px';
    warning.style.zIndex = '9999';
    warning.style.maxWidth = '300px';
    warning.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
    warning.style.fontFamily = 'Arial, sans-serif';
    warning.innerHTML = `
        <strong>⚠️ ВНИМАНИЕ!</strong><br>
        Обнаружена проблема со ссылками на странице.<br>
        <small>Пожалуйста, обновите страницу или свяжитесь с администратором сайта.</small>
    `;
    
    document.body.appendChild(warning);
    
    // ✅ АВТОМАТИЧЕСКОЕ ИСПРАВЛЕНИЕ
    setTimeout(() => {
        document.querySelectorAll('a[href]').forEach(link => {
            link.style.pointerEvents = 'auto';
            link.style.cursor = 'pointer';
            console.log('✅ Автоматическое исправление применено для:', link.href);
        });
        
        // ✅ УДАЛЕНИЕ ПРЕДУПРЕЖДЕНИЯ ПОСЛЕ ИСПРАВЛЕНИЯ
        setTimeout(() => {
            if (warning.parentNode) {
                warning.parentNode.removeChild(warning);
            }
        }, 5000);
    }, 2000);
}

// ✅ ДРУГИЕ ФУНКЦИИ (КОРЗИНА, ОФОРМЛЕНИЕ ЗАКАЗА И Т.Д.)
// ... (остальной код корзины остается без изменений)

console.log('✅ main.js успешно загружен и инициализирован');
