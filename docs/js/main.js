// Загрузка данных каталога
async function loadCatalogData() {
    try {
        const response = await fetch('data/catalog.json');
        if (!response.ok) {
            throw new Error(`Ошибка загрузки каталога: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('❌ Ошибка загрузки каталога:', error);
        // Резервные данные
        return {
            categories: [
                { id: 'furniture', name: 'Мебель', description: 'Офисная и кухонная мебель' },
                { id: 'equipment', name: 'Торговое оборудование', description: 'Стеллажи, прилавки, витрины' },
                { id: 'hardware', name: 'Мебельная фурнитура', description: 'Ручки, петли, направляющие' }
            ],
            products: [
                {
                    id: 'tv-stand-1',
                    category: 'furniture',
                    name: 'Тумба ТВ 1600×860×420 мм',
                    price: 14500,
                    oldPrice: 21000,
                    description: 'Современная тумба для ТВ',
                    imageUrl: 'images/products/tv-stand.jpg',
                    badge: '-30%',
                    inStock: true
                }
                // ... остальные товары
            ]
        };
    }
}

// Отображение категорий
async function renderCategories() {
    const catalogData = await loadCatalogData();
    const container = document.querySelector('.categories-grid');
    
    if (!container) return;
    
    container.innerHTML = '';
    
    catalogData.categories.forEach(category => {
        const categoryCard = document.createElement('a');
        categoryCard.href = `#${category.id}`;
        categoryCard.className = 'category-card';
        categoryCard.innerHTML = `
            <div class="category-image">
                <img src="${category.image || 'images/placeholder-category.jpg'}" alt="${category.name}" loading="lazy">
            </div>
            <h3 class="category-title">${category.name}</h3>
            <p>${category.description}</p>
        `;
        container.appendChild(categoryCard);
    });
}

// Отображение товаров по категориям
async function renderProductsByCategory() {
    const catalogData = await loadCatalogData();
    const sections = document.querySelectorAll('[id^="category-"], [id^="furniture"], [id^="equipment"], [id^="hardware"]');
    
    sections.forEach(section => {
        const sectionId = section.id;
        const categoryMap = {
            'furniture-section': 'furniture',
            'equipment-section': 'equipment', 
            'hardware-section': 'hardware'
        };
        
        const categoryId = categoryMap[sectionId] || sectionId.replace('category-', '');
        const container = section.querySelector('.products-grid');
        
        if (!container) return;
        
        // Фильтрация товаров по категории
        const categoryProducts = catalogData.products.filter(product => 
            product.category === categoryId && product.inStock
        );
        
        if (categoryProducts.length === 0) {
            container.innerHTML = '<p class="no-products">В этой категории пока нет товаров</p>';
            return;
        }
        
        container.innerHTML = '';
        
        categoryProducts.forEach(product => {
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

// Обновленная версия catalog.html с компонентами
function renderCatalogPage() {
    // Инициализация после загрузки DOM
    document.addEventListener('DOMContentLoaded', async function() {
        // Загрузка и отображение данных
        await renderCategories();
        await renderProductsByCategory();
        
        console.log('✅ Каталог успешно загружен и отображен');
    });
}

// Экспорт функций для использования в других файлах
window.renderCatalogPage = renderCatalogPage;
window.loadCatalogData = loadCatalogData;

console.log('✅ Основной скрипт сайта загружен');
