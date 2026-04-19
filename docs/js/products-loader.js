/**
 * products-loader.js - Загрузка, фильтрация и сортировка
 */
const ProductsLoader = (function() {
    let allProducts = [];
    // Состояние фильтров
    const state = {
        category: 'all',
        minPrice: null,
        maxPrice: null,
        sortBy: 'new' // 'new' (новые) или 'old' (старые)
    };

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
            // ПАРАЛЛЕЛЬНАЯ ЗАГРУЗКА (Быстро!)
            // ==========================================
            const fetchPromises = files.map(file => 
                fetch(`data/products/${file}`)
                    .then(resp => resp.ok ? resp.json() : null)
                    .catch(() => null)
            );

            const results = await Promise.all(fetchPromises);
            allProducts = results.filter(p => p !== null);

            // Если нет даты в JSON, добавим индекс как прокси даты
            allProducts.forEach((p, index) => {
                if (!p.dateAdded) p.dateAdded = index; 
            });

            if (allProducts.length === 0) {
                container.innerHTML = '<p style="text-align: center; padding: 40px;">Товары временно отсутствуют.</p>';
                return;
            }

            // 1. Рендерим кнопки категорий
            if (filtersContainer) renderCategoryFilters(filtersContainer);

            // 2. Инициализируем события инпутов (Цена/Сортировка)
            initAdvancedFilters();

            // 3. Применяем начальные фильтры
            applyFilters();

        } catch (e) {
            console.error('Ошибка загрузки каталога:', e);
            container.innerHTML = '<p style="text-align: center; padding: 40px; color: red;">Ошибка загрузки каталога.</p>';
        }
    }

    // --- Инициализация событий инпутов (Цена и Сортировка) ---
    function initAdvancedFilters() {
        const minInput = document.getElementById('min-price');
        const maxInput = document.getElementById('max-price');
        const sortSelect = document.getElementById('sort-date');

        // Слушаем ввод цены "От"
        if (minInput) {
            minInput.addEventListener('input', (e) => {
                state.minPrice = e.target.value ? Number(e.target.value) : null;
                applyFilters();
            });
        }

        // Слушаем ввод цены "До"
        if (maxInput) {
            maxInput.addEventListener('input', (e) => {
                state.maxPrice = e.target.value ? Number(e.target.value) : null;
                applyFilters();
            });
        }

        // Слушаем сортировку
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                state.sortBy = e.target.value;
                applyFilters();
            });
        }
    }

    // --- ГЛАВНАЯ ФУНКЦИЯ ПРИМЕНЕНИЯ ФИЛЬТРОВ ---
    function applyFilters() {
        let filtered = [...allProducts];

        // 1. Фильтр по Категории
        if (state.category !== 'all') {
            filtered = filtered.filter(p => p.category == state.category);
        }

        // 2. Фильтр по Цене
        if (state.minPrice !== null) {
            filtered = filtered.filter(p => p.price >= state.minPrice);
        }
        if (state.maxPrice !== null) {
            filtered = filtered.filter(p => p.price <= state.maxPrice);
        }

        // 3. Сортировка по Дате
        filtered.sort((a, b) => {
            if (state.sortBy === 'new') {
                return b.dateAdded - a.dateAdded; // Новые (больший индекс) сверху
            } else {
                return a.dateAdded - b.dateAdded; // Старые (меньший индекс) сверху
            }
        });

        // Рендерим результат
        renderProducts(filtered, document.getElementById('catalog-grid'));
    }

    // --- Рендер карточек (ИСПРАВЛЕНО: добавлены Цена и Название) ---
    function renderProducts(products, container) {
        if (!container) return;

        if (products.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:40px;"><h3>Ничего не найдено</h3><p>Попробуйте изменить параметры фильтра.</p></div>';
            return;
        }

        container.innerHTML = products.map(product => {
            const imgSrc = product.image ? product.image : `images/${product.id}.jpg`;
            // Проверяем наличие скидки
            const hasDiscount = product.old_price && product.old_price > product.price;

            return `
                <div class="product-card-simple" onclick="openProductModal('${product.id}')">
                    <div class="simple-card-img">
                        <img src="${imgSrc}" alt="${product.name}" 
                             onerror="if(!this.src.endsWith('nofoto.png')) this.src='images/nofoto.png'">
                    </div>
                    <div class="card-content">
                        <div class="product-price-block">
                            ${hasDiscount ? `<span class="old-price">${Utils.formatPrice(product.old_price)}</span>` : ''}
                            <span class="current-price">${Utils.formatPrice(product.price)}</span>
                        </div>
                        <div class="simple-card-name">${product.name}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // --- Рендер кнопок категорий ---
    function renderCategoryFilters(container) {
        const categories = {};
        allProducts.forEach(p => {
            const cat = p.category || 0;
            if (!categories[cat]) categories[cat] = 0;
            categories[cat]++;
        });

        const categoryNames = { 
            0: 'Все товары', 
            1: 'Торговое оборудование', 
            2: 'Складское оборудование', 
            3: 'Армейская мебель', 
            4: 'Кресла и стулья' 
        };

        let html = '<div style="display:flex; gap:10px; flex-wrap:wrap; justify-content:center;">';

        Object.keys(categories).sort().forEach(catId => {
            const isActive = catId == state.category ? 'btn-primary' : '';
            const name = categoryNames[catId] || `Раздел ${catId}`;
            html += `<button class="btn ${isActive}" style="background: ${isActive ? '' : 'white'}; color: ${isActive ? 'white' : 'black'}; border:1px solid #ddd;" onclick="ProductsLoader.setCategory(${catId})">${name}</button>`;
        });
        html += '</div>';
        container.innerHTML = html;
    }

    // --- Публичные методы ---
    
    // Смена категории (вызывается из HTML onclick)
    window.setCategory = function(catId) {
        state.category = catId;
        // Обновляем визуально кнопки
        const container = document.getElementById('catalog-filters');
        if (container) renderCategoryFilters(container);
        applyFilters();
    };

    // --- ЛОГИКА МОДАЛЬНОГО ОКНА ---
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

        const imgSrc = product.image ? product.image : `images/${product.id}.jpg`;
        img.src = imgSrc;
        img.onerror = function() { this.src = 'images/nofoto.png'; };

        title.textContent = product.name;
        
        // Цена со скидкой (если есть old_price и она больше текущей)
        let priceHtml = '';
        if (product.old_price && product.old_price > product.price) {
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

        // Характеристики в виде таблицы
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

        // Кнопка "В корзину"
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
        if (e.target === modal) closeProductModal();
    });

    return { loadCatalog, setCategory };
})();