/**
 * products-loader.js - Загрузка, фильтрация и сортировка
 */
const ProductsLoader = (function() {
    let allProducts = [];
    
    // Текущее состояние фильтров
    const state = {
        category: 'all',
        minPrice: null,
        maxPrice: null,
        sortBy: 'new' // 'new' или 'old'
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
            
            // Параллельная загрузка для скорости
            const fetchPromises = files.map(file => 
                fetch(`data/products/${file}`)
                    .then(resp => resp.ok ? resp.json() : null)
                    .catch(() => null)
            );
            
            const results = await Promise.all(fetchPromises);
            allProducts = results.filter(p => p !== null);

            // Если нет даты в JSON, добавим индекс как прокси даты
            // (Считаем, что последний в списке — самый новый)
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

            // 3. Первичный рендер
            applyFilters();
            
        } catch (e) {
            console.error('Ошибка загрузки:', e);
        }
    }

    // --- Инициализация событий инпутов ---
    function initAdvancedFilters() {
        const minInput = document.getElementById('min-price');
        const maxInput = document.getElementById('max-price');
        const sortSelect = document.getElementById('sort-date');

        // Слушаем ввод цены
        if (minInput) {
            minInput.addEventListener('input', (e) => {
                state.minPrice = e.target.value ? Number(e.target.value) : null;
                applyFilters();
            });
        }
        
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

    // --- Рендер карточек (Без изменений, как было) ---
    function renderProducts(products, container) {
        if (!container) return;

        if (products.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:40px;"><h3>Ничего не найдено</h3><p>Попробуйте изменить параметры фильтра.</p></div>';
            return;
        }

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
            // Добавляем onclick для изменения состояния
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
        const buttons = document.querySelectorAll('#catalog-filters .btn');
        buttons.forEach(btn => {
            btn.classList.remove('btn-primary');
            btn.style.background = 'white';
            btn.style.color = 'black';
        });
        // Находим нажатую кнопку (грубый поиск по тексту или перерендер)
        // Для простоты перерисуем кнопки, чтобы обновить активный класс
        renderCategoryFilters(document.getElementById('catalog-filters'));
        
        applyFilters();
    };

    // Делаем loadCatalog доступным (если вызывается из app.js)
    return { loadCatalog, setCategory };
})();