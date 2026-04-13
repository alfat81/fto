const ProductsLoader = (function() {
    
    async function loadCatalog() {
        const container = document.getElementById('catalog-grid');
        if (!container) return;

        try {
            // 1. Загружаем список файлов
            const indexResp = await fetch('data/products/index.json');
            if (!indexResp.ok) throw new Error('Не найден index.json');
            const files = await indexResp.json();

            container.innerHTML = ''; // Очистка

            // 2. Загружаем каждый товар
            for (const file of files) {
                try {
                    const resp = await fetch(`data/products/${file}`);
                    if (!resp.ok) continue;
                    const product = await resp.json();
                    renderProductCard(container, product);
                } catch (e) {
                    console.error(`Ошибка загрузки ${file}:`, e);
                }
            }

            if (container.children.length === 0) {
                container.innerHTML = '<p>Товары временно отсутствуют.</p>';
            }

        } catch (e) {
            console.error('Ошибка загрузки каталога:', e);
            container.innerHTML = '<p>Ошибка загрузки каталога. Проверьте консоль.</p>';
        }
    }

    function renderProductCard(container, product) {
        const card = document.createElement('div');
        // Добавляем стандартные классы, ожидаемые в style.css (product-card, card и т.д.)
        // Если в CSS есть класс .product-card, он применится.
        card.className = 'product-card'; 
        card.dataset.id = product.id;
        card.dataset.name = product.name;
        card.dataset.price = product.price;
        
        // Формируем HTML карточки
        // Примечание: Если изображение не найдется, будет заглушка
        const imgSrc = product.image ? product.image : 'via.placeholder.com/300x200?text=No+Image';
        
        let specsHtml = '';
        if (product.specs) {
            specsHtml = '<ul style="font-size:0.85em; color:#555; padding-left:20px; margin:10px 0;">';
            for (const [key, val] of Object.entries(product.specs)) {
                specsHtml += `<li><b>${key}:</b> ${val}</li>`;
            }
            specsHtml += '</ul>';
        }

        card.innerHTML = `
            <div style="overflow:hidden; border-radius:4px 4px 0 0;">
                <img src="${imgSrc}" alt="${product.name}" style="width:100%; height:auto; display:block;">
            </div>
            <div style="padding:15px;">
                <h3 class="product-title" style="margin:0 0 10px; font-size:1.1em;">${product.name}</h3>
                <p style="font-size:0.9em; color:#666; margin-bottom:10px;">${product.description || ''}</p>
                ${specsHtml}
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:15px;">
                    <span style="font-size:1.2em; font-weight:bold; color:#333;">${Utils.formatCurrency(product.price)}</span>
                    <button class="btn-add-to-cart" style="cursor:pointer; padding:8px 15px; background:#007bff; color:#fff; border:none; border-radius:4px;">В корзину</button>
                </div>
            </div>
        `;

        // Навешиваем событие клика на кнопку внутри карточки
        const btn = card.querySelector('.btn-add-to-cart');
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Чтобы не срабатывали другие клики
            CartModule.add({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image
            });
        });

        container.appendChild(card);
    }

    return { loadCatalog };
})();