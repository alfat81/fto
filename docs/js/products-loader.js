const ProductsLoader = (function() {
    // Функция загрузки из JSON файлов (как было)
    async function loadCatalog() {
        const container = document.getElementById('catalog-grid');
        if (!container) return;
        try {
            const indexResp = await fetch('data/products/index.json');
            if (!indexResp.ok) throw new Error('Не найден index.json');
            const files = await indexResp.json();
            container.innerHTML = ''; 
            for (const file of files) {
                try {
                    const resp = await fetch(`data/products/${file}`);
                    if (!resp.ok) continue;
                    const product = await resp.json();
                    renderProductCard(container, product);
                } catch (e) { console.error(`Ошибка загрузки ${file}:`, e); }
            }
            if (container.children.length === 0) {
                container.innerHTML = '<p>Товары временно отсутствуют.</p>';
            }
        } catch (e) {
            console.error('Ошибка загрузки каталога:', e);
            container.innerHTML = '<p>Ошибка загрузки каталога.</p>';
        }
    }

    // Функция отрисовки одной карточки
    function renderProductCard(container, product) {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.dataset.id = product.id;
        card.dataset.name = product.name;
        card.dataset.price = product.price;

        const imgSrc = product.image ? product.image : `images/${product.id}.jpg`;
        
        let specsHtml = '';
        if (product.specs) {
            specsHtml = '<ul style="font-size:0.85em; color:#555; padding-left:20px; margin:10px 0;">';
            // Поддержка массива или объекта спецификаций
            if (Array.isArray(product.specs)) {
                specsHtml += product.specs.map(s => `<li>${s}</li>`).join('');
            } else {
                for (const [key, val] of Object.entries(product.specs)) {
                    specsHtml += `<li><b>${key}:</b> ${val}</li>`;
                }
            }
            specsHtml += '</ul>';
        }

        card.innerHTML = `
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
        `;

        // Обработчик кнопки
        const btn = card.querySelector('.btn-add');
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (typeof CartModule !== 'undefined') {
                CartModule.add({
                    id: product.id,
                    name: product.name,
                    price: product.price
                });
            }
        });

        container.appendChild(card);
    }

    // --- НОВЫЕ МЕТОДЫ ДЛЯ CATALOG.HTML ---
    
    // Отрисовка списка товаров (для главной и каталога)
    function renderProducts(products, container) {
        if (!container || !products) return;
        container.innerHTML = '';
        products.forEach(p => renderProductCard(container, p));
    }

    // Отрисовка фильтров по категориям
    function renderFilters(products, container) {
        if (!container || !products) return;
        container.innerHTML = '';

        // Собираем уникальные категории
        const categories = {};
        products.forEach(p => {
            if (p.category) categories[p.category] = true;
        });

        // Кнопка "Все"
        const allBtn = document.createElement('button');
        allBtn.className = 'btn btn-primary';
        allBtn.textContent = 'Все товары';
        allBtn.onclick = () => renderProducts(products, document.getElementById('catalog-grid')); // Тут нужен доступ к контейнеру, упростим для примера
        container.appendChild(allBtn);

        // Кнопки категорий (если есть данные о названиях категорий)
        if (typeof CATEGORY_NAMES !== 'undefined') {
            for (const [catId, catName] of Object.entries(CATEGORY_NAMES)) {
                if (categories[catId]) {
                    const btn = document.createElement('button');
                    btn.className = 'btn';
                    btn.textContent = catName;
                    btn.onclick = () => {
                        const filtered = products.filter(p => p.category == catId);
                        renderProducts(filtered, document.getElementById('catalog-grid')); // Завязка на ID
                    };
                    container.appendChild(btn);
                }
            }
        }
    }

    return { 
        loadCatalog, 
        renderProducts, // Теперь этот метод доступен
        renderFilters   // И этот тоже
    };
})();