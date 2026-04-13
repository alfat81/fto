/**
 * docs/js/products-loader.js
 * Отвечает за отрисовку каталога из CATALOG_DATA
 */

const ProductsLoader = {
    /**
     * Отрисовка товаров в сетке
     * @param {Array} products - Массив товаров из catalog-data.js
     * @param {HTMLElement} container - DOM элемент куда вставлять (напр. #full-catalog)
     */
    renderProducts: function(products, container) {
        if (!container || !products || products.length === 0) {
            if(container) container.innerHTML = '<p>Товары не найдены.</p>';
            return;
        }

        container.innerHTML = products.map(product => {
            // Путь к картинке (напр. images/1.1.jpg)
            const imgUrl = `images/${product.id}.jpg`; 
            
            return `
                <div class="product-card" 
                     data-id="${product.id}" 
                     data-name="${product.name}" 
                     data-price="${product.price}">
                    
                    <div class="product-image-wrap">
                        <img src="${imgUrl}" 
                             alt="${product.name}"
                             onerror="this.src='https://via.placeholder.com/400x300/e2e8f0/64748b?text=Нет+фото'">
                    </div>
                    
                    <div class="product-info">
                        <div class="product-title">${product.name}</div>
                        <p class="product-description">${product.description || ''}</p>
                        
                        ${product.specs ? `
                            <ul class="product-specs">
                                ${product.specs.map(s => `<li>• ${s}</li>`).join('')}
                            </ul>
                        ` : ''}
                        
                        <div class="product-price-row">
                            <span class="price">${Utils.formatPrice(product.price)}</span>
                            <button class="btn-add" 
                                    data-id="${product.id}" 
                                    data-name="${product.name}" 
                                    data-price="${product.price}">
                                В корзину
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        console.log(`✅ Загружено ${products.length} товаров`);
    },

    /**
     * Создание кнопок фильтров по категориям
     */
    renderFilters: function(products, container) {
        if (!container) return;

        // Собираем уникальные категории
        const categories = {};
        products.forEach(p => {
            const cat = p.category;
            if (!categories[cat]) categories[cat] = 0;
            categories[cat]++;
        });

        // Рисуем кнопку "Все"
        let html = `<button class="btn active" data-category="all">Все товары</button>`;

        // Рисуем кнопки категорий
        Object.keys(categories).forEach(catId => {
            const catName = window.CATEGORY_NAMES?.[catId] || `Категория ${catId}`;
            html += `<button class="btn" data-category="${catId}">${catName}</button>`;
        });

        container.innerHTML = html;

        // Вешаем события клика
        container.querySelectorAll('.btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Убираем active у всех
                container.querySelectorAll('.btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');

                const catVal = e.target.dataset.category;
                const filtered = catVal === 'all' 
                    ? products 
                    : products.filter(p => p.category == catVal);
                
                // Перерисовываем
                this.renderProducts(filtered, document.getElementById('full-catalog'));
            });
        });
    }
};