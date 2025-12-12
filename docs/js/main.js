// Основной скрипт сайта
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Основной скрипт загружен');
    
    // Инициализация плавной прокрутки
    initSmoothScroll();
    
    // Инициализация эффекта при прокрутке для хедера
    initHeaderScrollEffect();
    
    // Инициализация анимации элементов при прокрутке
    initScrollAnimations();
    
    // Загрузка и отображение каталога (только на странице каталога)
    if (document.querySelector('.products-grid') || document.querySelector('.categories-grid')) {
        renderCatalog();
    }
});

// Плавная прокрутка
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
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
}

// Эффект при прокрутке для хедера
function initHeaderScrollEffect() {
    window.addEventListener('scroll', function() {
        const header = document.querySelector('header');
        if (header) {
            if (window.scrollY > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
    });
}

// Анимация элементов при прокрутке
function initScrollAnimations() {
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
    
    window.addEventListener('scroll', checkScroll);
    checkScroll(); // Проверить сразу при загрузке
}

// Отображение каталога
async function renderCatalog() {
    try {
        const response = await fetch('data/catalog.json');
        if (!response.ok) throw new Error('Не удалось загрузить каталог');
        
        const catalogData = await response.json();
        
        // Отображение категорий
        renderCategories(catalogData.categories);
        
        // Отображение товаров по категориям
        renderProductsByCategory(catalogData.products);
        
        console.log('✅ Каталог успешно загружен и отображен');
    } catch (error) {
        console.error('❌ Ошибка загрузки каталога:', error);
        createFallbackCatalog();
    }
}

// Отображение категорий
function renderCategories(categories) {
    const container = document.querySelector('.categories-grid');
    if (!container) return;
    
    container.innerHTML = '';
    
    categories.forEach(category => {
        const categoryCard = document.createElement('a');
        categoryCard.href = `#${category.id}`;
        categoryCard.className = 'category-card';
        categoryCard.innerHTML = `
            <div class="category-image">
                <img src="${category.image}" alt="${category.name}" loading="lazy">
            </div>
            <h3 class="category-title">${category.name}</h3>
            <p>${category.description}</p>
        `;
        container.appendChild(categoryCard);
    });
}

// Отображение товаров по категориям
function renderProductsByCategory(products) {
    const sections = {
        'furniture': document.querySelector('#furniture-section .products-grid'),
        'equipment': document.querySelector('#equipment-section .products-grid'),
        'hardware': document.querySelector('#hardware-section .products-grid')
    };
    
    // Очистка контейнеров
    Object.values(sections).forEach(container => {
        if (container) container.innerHTML = '';
    });
    
    // Группировка товаров по категориям
    const groupedProducts = {
        'furniture': [],
        'equipment': [],
        'hardware': []
    };
    
    products.forEach(product => {
        if (groupedProducts[product.category] && product.inStock !== false) {
            groupedProducts[product.category].push(product);
        }
    });
    
    // Отображение товаров в соответствующих секциях
    Object.entries(groupedProducts).forEach(([category, items]) => {
        const container = sections[category];
        if (!container) return;
        
        if (items.length === 0) {
            container.innerHTML = '<p class="no-products">В этой категории пока нет товаров</p>';
            return;
        }
        
        items.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card parallax-item';
            productCard.innerHTML = `
                <div class="product-image">
                    <img src="${product.imageUrl}" alt="${product.name}" loading="lazy">
                    ${product.badge ? `<div class="product-badge">${product.badge}</div>` : ''}
                </div>
                <div class="product-content">
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-price">
                        ${product.price.toLocaleString('ru-RU')} ₽
                        ${product.oldPrice ? `<span class="old-price">${product.oldPrice.toLocaleString('ru-RU')} ₽</span>` : ''}
                    </div>
                    <p class="product-description">${product.description}</p>
                    <div class="product-actions">
                        <button class="btn contact-btn add-to-cart"
                            data-id="${product.id}"
                            data-name="${product.name}"
                            data-price="${product.price}"
                            data-image="${product.imageUrl}">
                            <i class="fas fa-cart-plus"></i> В корзину
                        </button>
                        <a href="tel:+79601786738" class="btn contact-btn phone-btn">Позвонить</a>
                    </div>
                </div>
            `;
            container.appendChild(productCard);
        });
    });
}

// Резервное создание каталога
function createFallbackCatalog() {
    console.log('🔄 Создание резервного каталога');
    
    const products = [
        {
            id: 'tv-stand-1',
            name: 'Тумба ТВ 1600×860×420 мм',
            price: 14500,
            oldPrice: 21000,
            description: 'Современная тумба для ТВ с качественной фурнитурой',
            imageUrl: 'images/products/tv-stand.jpg',
            category: 'furniture',
            badge: '-30%'
        },
        {
            id: 'small-cabinet-1',
            name: 'Тумба 530×450×250 мм',
            price: 6400,
            description: 'Компактная тумба для хранения документов',
            imageUrl: 'images/products/small-cabinet.jpg',
            category: 'furniture'
        }
    ];
    
    const furnitureContainer = document.querySelector('#furniture-section .products-grid');
    if (furnitureContainer) {
        furnitureContainer.innerHTML = '';
        
        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card parallax-item';
            productCard.innerHTML = `
                <div class="product-image">
                    <img src="${product.imageUrl}" alt="${product.name}" loading="lazy">
                    ${product.badge ? `<div class="product-badge">${product.badge}</div>` : ''}
                </div>
                <div class="product-content">
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-price">
                        ${product.price.toLocaleString('ru-RU')} ₽
                        ${product.oldPrice ? `<span class="old-price">${product.oldPrice.toLocaleString('ru-RU')} ₽</span>` : ''}
                    </div>
                    <p class="product-description">${product.description}</p>
                    <div class="product-actions">
                        <button class="btn contact-btn add-to-cart"
                            data-id="${product.id}"
                            data-name="${product.name}"
                            data-price="${product.price}">
                            <i class="fas fa-cart-plus"></i> В корзину
                        </button>
                        <a href="tel:+79601786738" class="btn contact-btn phone-btn">Позвонить</a>
                    </div>
                </div>
            `;
            furnitureContainer.appendChild(productCard);
        });
    }
}
