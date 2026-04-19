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
            
            const indexResp = await fetch('data/products/index.json');
            if (!indexResp.ok) throw new Error('Не найден index.json');
            const files = await indexResp.json();
            
            allProducts = [];
            
            // Параллельная загрузка для скорости
            const fetchPromises = files.map(file => 
                fetch(`data/products/${file}`)
                    .then(resp => resp.ok ? resp.json() : null)
                    .catch(() => null)
            );
            
            const results = await Promise.all(fetchPromises);
            allProducts = results.filter(p => p !== null);
            
            if (allProducts.length === 0) {
                container.innerHTML = '<p style="text-align: center; padding: 40px;">Товары временно отсутствуют.</p>';
                return;
            }

            // Проверка поиска
            const urlParams = new URLSearchParams(window.location.search);
            const searchQuery = urlParams.get('search');
            let productsToShow = allProducts;

            if (searchQuery) {
                const lowerQuery = searchQuery.toLowerCase();
                const headerInput = document.getElementById('site-search-input');
                if (headerInput) headerInput.value = searchQuery;

                productsToShow = allProducts.filter(product => {
                    return product.name.toLowerCase().includes(lowerQuery) || 
                           (product.description && product.description.toLowerCase().includes(lowerQuery)) ||
                           String(product.category).includes(lowerQuery);
                });
            }

            if (filtersContainer) renderFilters(filtersContainer);
            renderProducts(productsToShow, container, searchQuery);
            
        } catch (e) {
            console.error('Ошибка загрузки каталога:', e);
            container.innerHTML = '<p style="text-align: center; padding: 40px; color: red;">Ошибка загрузки каталога.</p>';
        }
    }

    function renderProducts(products, container, searchQuery) {
        if (!container) return;

        if (products.length === 0) {
            container.innerHTML = searchQuery 
                ? `<div style="text-align:center; padding:40px;"><h3>По запросу "<strong>${searchQuery}</strong>" ничего не найдено</h3></div>`
                : '<p style="text-align: center; padding: 40px;">В этой категории пока нет товаров.</p>';
            return;
        }

        container.innerHTML = products.map(product => {
            const imgSrc = product.image ? product.image : `images/${product.id}.jpg`;
            
            return `
                <div class="product-card-simple" onclick="openProductModal('${product.id}')">
                    <div class="product-image-wrap">
                        <img src="${imgSrc}" alt="${product.name}" 
                             onerror="if(!this.src.endsWith('nofoto.png')) this.src='images/nofoto.png'">
                    </div>
                    <div class="product-title-simple">${product.name}</div>
                </div>
            `;
        }).join('');
    }

    // Делаем функцию доступной глобально
    window.openProductModal = function(id) {
        const product = allProducts.find(p => p.id == id);
        if (!product) return;

        const modal = document.getElementById('product-modal');
        const img = document.getElementById('modal-img');
        const title = document.getElementById('modal-title');
        const priceBlock = document.getElementById('modal-price-block');
        const desc = document.getElementById('modal-desc');
        const specsTable = document.getElementById('modal-specs');
        const addBtn = document.getElementById('modal-add-btn');

        // Заполнение данными
        const imgSrc = product.image ? product.image : `images/${product.id}.jpg`;
        img.src = imgSrc;
        img.onerror = function() { this.src = 'images/nofoto.png'; };
        
        title.textContent = product.name;
        
        // Блок цены с возможностью скидки
        let priceHtml = '';
        if (product.old_price) {
            priceHtml = `
                <div class="modal-price-block">
                    <span class="modal-current-price">${Utils.formatPrice(product.price)}</span>
                    <span class="modal-old-price">${Utils.formatPrice(product.old_price)}</span>
                </div>
            `;
        } else {
            priceHtml = `<div class="modal-price-block"><span class="modal-current-price">${Utils.formatPrice(product.price)}</span></div>`;
        }
        priceBlock.innerHTML = priceHtml;
        
        desc.textContent = product.description || 'Описание отсутствует.';

        // Характеристики
        let specsHtml = '<table class="modal-specs-table">';
        if (product.specs) {
            if (Array.isArray(product.specs)) {
                product.specs.forEach(spec => specsHtml += `<tr><td colspan="2">• ${spec}</td></tr>`);
            } else {
                for (const [key, val] of Object.entries(product.specs)) {
                    specsHtml += `<tr><td>${key}</td><td>${val}</td></tr>`;
                }
            }
        }
        specsHtml += '</table>';
        specsTable.innerHTML = specsHtml;

        // Кнопка добавления
        addBtn.onclick = function() {
            if (typeof CartModule !== 'undefined') { 
                CartModule.add({ id: product.id, name: product.name, price: product.price });
                if (typeof ToastModule !== 'undefined') ToastModule.show('Товар добавлен в корзину', 'success');
                closeProductModal();
            }
        };

        // Показать модальное окно
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    };

    window.closeProductModal = function() {
        const modal = document.getElementById('product-modal');
        modal.style.display = 'none';
        document.body.style.overflow = '';
    };

    // Закрытие по клику вне окна
    document.addEventListener('click', function(e) {
        const modal = document.getElementById('product-modal');
        if (e.target === modal) {
            closeProductModal();
        }
    });

    function renderFilters(container) {
        const categories = {};
        allProducts.forEach(p => {
            const cat = p.category || 0;
            if (!categories[cat]) categories[cat] = 0;
            categories[cat]++;
        });

        const categoryNames = { 0: 'Все товары', 1: 'Торговые стеллажи', 2: 'Холодильное оборудование', 3: 'Кассовое оборудование', 4: 'Кресла и стулья' };
        let html = '<div class="filters-list">';
        
        Object.keys(categories).sort().forEach(catId => {
            const catName = categoryNames[catId] || `Категория ${catId}`;
            const isActive = catId == currentCategory ? 'active' : '';
            html += `<button class="btn filter-btn ${isActive}" data-category="${catId}">${catName}</button>`;
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

    return { loadCatalog };
})();