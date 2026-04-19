/**
 * products-loader.js - Загрузка товаров, фильтрация и поиск
 */
const ProductsLoader = (function() {
    let allProducts = [];
    let currentCategory = 'all';

    async function loadCatalog() {
        const container = document.getElementById('catalog-grid');
        const filtersContainer = document.getElementById('catalog-filters');
        
        if (!container) return;

        try {
            container.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-light);">Загрузка товаров...</p>';

            // 1. Загружаем список файлов (index.json)
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

            // 3. Проверка поискового запроса в URL (?search=...)
            const urlParams = new URLSearchParams(window.location.search);
            const searchQuery = urlParams.get('search');
            let productsToShow = allProducts;

            // Если есть запрос поиска
            if (searchQuery) {
                const lowerQuery = searchQuery.toLowerCase();
                
                // Вставляем текст в поле поиска в шапке, если оно есть
                const headerInput = document.getElementById('site-search-input');
                if (headerInput) headerInput.value = searchQuery;

                // Фильтруем массив товаров
                productsToShow = allProducts.filter(product => {
                    if (product.name.toLowerCase().includes(lowerQuery)) return true;
                    if (product.description && product.description.toLowerCase().includes(lowerQuery)) return true;
                    if (String(product.category).includes(lowerQuery)) return true;
                    return false;
                });
            }

            // 4. Рендерим фильтры
            if (filtersContainer) {
                renderFilters(filtersContainer);
            }

            // 5. Показываем товары
            renderProducts(productsToShow, container, searchQuery);

        } catch (e) {
            console.error('Ошибка загрузки каталога:', e);
            container.innerHTML = '<p style="text-align: center; padding: 40px; color: red;">Ошибка загрузки каталога.</p>';
        }
    }

    function renderProducts(products, container, searchQuery) {
        if (!container) return;

        if (products.length === 0) {
            if (searchQuery) {
                container.innerHTML = `<div style="text-align:center; padding:40px;">
                    <h3>По запросу "<strong>${searchQuery}</strong>" ничего не найдено</h3>
                    <p>Попробуйте изменить запрос или посмотрите весь каталог.</p>
                </div>`;
            } else {
                container.innerHTML = '<p style="text-align: center; padding: 40px;">В этой категории пока нет товаров.</p>';
            }
            return;
        }

        container.innerHTML = products.map(product => {
            const imgSrc = product.image ? product.image : `images/${product.id}.jpg`;

            // Формируем характеристики
            let specsHtml = '';
            if (product.specs) {
                specsHtml = '<ul class="product-specs">';
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
                        <img src="${imgSrc}" alt="${product.name}" 
                            onerror="if(!this.src.endsWith('nofoto.png')) this.src='images/nofoto.png'">
                    </div>
                    <div class="product-info">
                        <h3 class="product-title">${product.name}</h3>
                        <p class="product-description">${product.description || ''}</p>
                        ${specsHtml}
                        <div class="product-price-row">
                            <span class="price">${Utils.formatPrice(product.price)}</span>
                            <button class="btn-add" data-id="${product.id}" data-name="${product.name}" data-price="${product.price}">
                                <i class="fas fa-cart-plus"></i> В корзину
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Навешиваем обработчики
        container.querySelectorAll('.btn-add').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const name = e.currentTarget.dataset.name;
                const price = parseFloat(e.currentTarget.dataset.price);

                if (typeof CartModule !== 'undefined') {
                    CartModule.add({ id, name, price });
                    if (typeof ToastModule !== 'undefined') {
                        ToastModule.show('Товар добавлен в корзину', 'success');
                    }
                }
            });
        });
    }

    function renderFilters(container) {
        const categories = {};
        allProducts.forEach(p => {
            const cat = p.category || 0;
            if (!categories[cat]) categories[cat] = 0;
            categories[cat]++;
        });

        const categoryNames = {
            0: 'Все товары',
            1: 'Торговые стеллажи',
            2: 'Холодильное оборудование',
            3: 'Кассовое оборудование',
            4: 'Кресла и стулья'
        };

        let html = '<div class="filters-list">';

        Object.keys(categories).sort().forEach(catId => {
            const catName = categoryNames[catId] || `Категория ${catId}`;
            const isActive = catId == currentCategory ? 'active' : '';

            html += `
                <button class="btn filter-btn ${isActive}" data-category="${catId}">
                    ${catName}
                </button>
            `;
        });

        html += '</div>';
        container.innerHTML = html;

        container.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const catId = e.currentTarget.dataset.category;
                const urlParams = new URLSearchParams(window.location.search);
                
                if (urlParams.get('search')) {
                    window.location.href = `catalog.html?category=${catId}`;
                    return;
                }

                filterByCategory(catId);
                container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
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

    return { loadCatalog, renderProducts };
})();