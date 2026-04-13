/**
 * products-loader.js - Загрузка товаров из data/products/
 */
const ProductsLoader = (function() {
    
    async function loadCatalog() {
        // ИСПРАВЛЕНО: ищем контейнер по ID, который есть в catalog.html
        const container = document.getElementById('full-catalog');
        if (!container) return;

        try {
            container.innerHTML = '<p style="text-align:center; padding:40px;">Загрузка каталога...</p>';
            
            // Загружаем список файлов
            const indexResp = await fetch('data/products/index.json');
            if (!indexResp.ok) throw new Error('Не найден index.json');
            const files = await indexResp.json();
            
            container.innerHTML = ''; // Очищаем индикатор загрузки

            // Загружаем каждый товар
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
                container.innerHTML = '<p style="text-align:center; padding:40px;">Товары временно отсутствуют.</p>';
            }
        } catch (e) {
            console.error('Ошибка загрузки каталога:', e);
            container.innerHTML = '<p style="text-align:center; padding:40px; color:red;">Ошибка загрузки каталога.</p>';
        }
    }

    function renderProductCard(container, product) {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.dataset.id = product.id;
        card.dataset.name = product.name;
        card.dataset.price = product.price;
        card.dataset.category = product.category || 1; // Для фильтров

        const imgSrc = product.image ? product.image : `images/${product.id}.jpg`;
        
        let specsHtml = '';
        if (product.specs) {
            specsHtml = '<ul style="font-size:0.85em; color:#555; padding-left:20px; margin:10px 0; list-style-type:disc;">';
            for (const [key, val] of Object.entries(product.specs)) {
                specsHtml += `<li><b>${key}:</b> ${val}</li>`;
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

        container.appendChild(card);
    }

    return { loadCatalog };
})();