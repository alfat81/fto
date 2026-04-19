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
            
            // ==========================================
            // ПАРАЛЛЕЛЬНАЯ ЗАГРУЗКА (Promise.all)
            // ==========================================
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

            if (filtersContainer) renderFilters(filtersContainer);
            renderProducts(allProducts, container);
            
        } catch (e) {
            console.error('Ошибка загрузки:', e);
        }
    }

    // Отрисовка простых карточек (Фото + Название)
    function renderProducts(products, container) {
        if (!container) return;

        container.innerHTML = products.map(product => {
            const imgSrc = product.image ? product.image : `images/${product.id}.jpg`;
            
            return `
                <div class="product-card-simple" onclick="openProductModal('${product.id}')">
                    <div class="simple-card-img">
                        <img src="${imgSrc}" alt="${product.name}" 
                             onerror="if(!this.src.endsWith('nofoto.png')) this.src='images/nofoto.png'">
                    </div>
                    <div class="simple-card-name">${product.name}</div>
                </div>
            `;
        }).join('');
    }

    // ==========================================
    // ЛОГИКА МОДАЛЬНОГО ОКНА
    // ==========================================
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
        priceBlock.textContent = Utils.formatPrice(product.price);
        desc.textContent = product.description || '';

        // Генерация таблицы характеристик
        let specsHtml = '';
        if (product.specs) {
            if (Array.isArray(product.specs)) {
                product.specs.forEach(spec => {
                    specsHtml += `<tr><td colspan="2">• ${spec}</td></tr>`;
                });
            } else {
                for (const [key, val] of Object.entries(product.specs)) {
                    specsHtml += `<tr><td>${key}</td><td>${val}</td></tr>`;
                }
            }
        }
        specsTable.innerHTML = specsHtml;

        // Кнопка "В корзину"
        addBtn.onclick = function() {
            if (typeof CartModule !== 'undefined') { 
                CartModule.add({ id: product.id, name: product.name, price: product.price });
                if (typeof ToastModule !== 'undefined') ToastModule.show('Товар добавлен в корзину', 'success');
                closeProductModal();
            }
        };

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

    // Фильтры (категории)
    function renderFilters(container) {
        const categories = {};
        allProducts.forEach(p => {
            const cat = p.category || 0;
            if (!categories[cat]) categories[cat] = 0;
            categories[cat]++;
        });

        const categoryNames = { 0: 'Все товары', 1: 'Стеллажи', 2: 'Холод', 3: 'Кассы', 4: 'Кресла' };
        let html = '<div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:20px;">';
        
        Object.keys(categories).sort().forEach(catId => {
            const isActive = catId == currentCategory ? 'btn-primary' : '';
            const name = categoryNames[catId] || `Категория ${catId}`;
            html += `<button class="btn ${isActive}" style="background: ${isActive ? '' : 'white'}; color: ${isActive ? 'white' : 'black'}; border:1px solid #ddd;" onclick="ProductsLoader.filterByCategory(${catId})">${name}</button>`;
        });
        html += '</div>';
        container.innerHTML = html;
    }

    window.filterByCategory = function(categoryId) {
        currentCategory = categoryId;
        const container = document.getElementById('catalog-grid');
        const filtered = (categoryId === '0' || categoryId === 'all') 
            ? allProducts 
            : allProducts.filter(p => p.category == categoryId);
        
        renderProducts(filtered, container);
        renderFilters(document.getElementById('catalog-filters')); // Обновить активную кнопку
    };

    return { loadCatalog, renderProducts, filterByCategory };
})();