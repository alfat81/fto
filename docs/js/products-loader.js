const ProductsLoader = (function() {
    let allProducts = [];
    let currentCategory = 'all';

    async function loadCatalog() {
        const container = document.getElementById('catalog-grid');
        const filtersContainer = document.getElementById('catalog-filters');
        
        if (!container) return;

        try {
            container.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-light);">Загрузка товаров...</p>';
            
            // 1. Загружаем список файлов
            const indexResp = await fetch('data/products/index.json');
            if (!indexResp.ok) throw new Error('Не найден index.json');
            const files = await indexResp.json();
            
            allProducts = [];
            
            // 2. Загружаем каждый товар
            for (const file of files) {
                try {
                    const resp = await fetch(`data/products/${file}`);
                    if (!resp.ok) continue;
                    const product = await resp.json();
                    allProducts.push(product);
                } catch (e) {
                    console.error(`Ошибка загрузки ${file}:`, e);
                }
            }
            
            if (allProducts.length === 0) {
                container.innerHTML = '<p style="text-align: center; padding: 40px;">Товары временно отсутствуют.</p>';
                return;
            }
            
            // 3. Рендерим фильтры
            if (filtersContainer) {
                renderFilters(filtersContainer);
            }
            
            // 4. Показываем все товары
            renderProducts(allProducts, container);
            
        } catch (e) {
            console.error('Ошибка загрузки каталога:', e);
            container.innerHTML = '<p style="text-align: center; padding: 40px; color: red;">Ошибка загрузки каталога.</p>';
        }
    }

    function renderFilters(container) {
        // Собираем уникальные категории
        const categories = {};
        allProducts.forEach(p => {
            const cat = p.category || 0;
            if (!categories[cat]) categories[cat] = 0;
            categories[cat]++;
        });

        // Определяем названия категорий
        const categoryNames = {
            0: 'Все товары',
            1: 'Торговые стеллажи',
            2: 'Холодильное оборудование',
            3: 'Кассовое оборудование',
            4: 'Кресла и стулья'
        };

        // Создаем кнопки
        let html = '<div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;">';
        
        Object.keys(categories).sort().forEach(catId => {
            const catName = categoryNames[catId] || `Категория ${catId}`;
            const count = categories[catId];
            const isActive = catId == currentCategory ? 'active' : '';
            
            html += `
                <button class="btn filter-btn ${isActive}" 
                        data-category="${catId}"
                        style="padding: 10px 20px; border: 1px solid var(--border); background: ${catId == currentCategory ? 'var(--primary)' : 'white'}; color: ${catId == currentCategory ? 'white' : 'var(--text-main)'}; border-radius: 20px; cursor: pointer; font-weight: 500; transition: all 0.2s;">
                    ${catName} (${count})
                </button>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;

        // Добавляем обработчики кликов
        container.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const catId = e.target.dataset.category;
                filterByCategory(catId);
                
                // Обновляем активную кнопку
                container.querySelectorAll('.filter-btn').forEach(b => {
                    b.style.background = 'white';
                    b.style.color = 'var(--text-main)';
                });
                e.target.style.background = 'var(--primary)';
                e.target.style.color = 'white';
            });
        });
    }

    function filterByCategory(categoryId) {
        currentCategory = categoryId;
        const container = document.getElementById('catalog-grid');
        
        if (categoryId === 'all' || categoryId === '0') {
            renderProducts(allProducts, container);
        } else {
            const filtered = allProducts.filter(p => p.category == categoryId);
            renderProducts(filtered, container);
        }
    }

    function renderProducts(products, container) {
        if (!container || !products) return;
        
        if (products.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 40px; grid-column: 1/-1;">В этой категории пока нет товаров.</p>';
            return;
        }
        
        container.innerHTML = products.map(product => {
            const imgSrc = product.image ? product.image : `images/${product.id}.jpg`;
            
            let specsHtml = '';
            if (product.specs) {
                specsHtml = '<ul style="font-size: 0.85em; color: var(--text-light); padding-left: 20px; margin: 10px 0;">';
                if (Array.isArray(product.specs)) {
                    specsHtml += product.specs.map(s => `<li>${s}</li>`).join('');
                } else {
                    for (const [key, val] of Object.entries(product.specs)) {
                        specsHtml += `<li><b>${key}:</b> ${val}</li>`;
                    }
                }
                specsHtml += '</ul>';
            }

            return `
                <div class="product-card" data-id="${product.id}" data-name="${product.name}" data-price="${product.price}">
                    <div class="product-image-wrap">
                        <img src="${imgSrc}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/300x200?text=Нет+фото'">
                    </div>
                    <div class="product-info">
                        <h3 class="product-title">${product.name}</h3>
                        <p class="product-description">${product.description || ''}</p>
                        ${specsHtml}
                        <div class="product-price-row">
                            <span class="price">${Utils.formatPrice(product.price)}</span>
                            <button class="btn-add" data-id="${product.id}" data-name="${product.name}" data-price="${product.price}">В корзину</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Добавляем обработчики кнопок "В корзину"
        container.querySelectorAll('.btn-add').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                const name = e.target.dataset.name;
                const price = parseFloat(e.target.dataset.price);
                
                if (typeof CartModule !== 'undefined') {
                    CartModule.add({ id, name, price });
                    if (typeof ToastModule !== 'undefined') {
                        ToastModule.show('Товар добавлен в корзину', 'success');
                    }
                }
            });
        });
    }

    return { loadCatalog, renderProducts };
})();