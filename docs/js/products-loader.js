/**
 * products-loader.js - Загрузка товаров из data/products/
 */
const ProductsLoader = {
    async loadCatalog() {
        const container = document.getElementById('full-catalog');
        if (!container) return;
        
        container.innerHTML = '<p style="text-align:center; padding:40px;">Загрузка каталога...</p>';
        try {
            const resp = await fetch('data/products/index.json');
            if (!resp.ok) throw new Error('index.json не найден');
            const files = await resp.json();
            
            container.innerHTML = '';
            for (const file of files) {
                try {
                    const pResp = await fetch(`data/products/${file}`);
                    if (!pResp.ok) continue;
                    const product = await pResp.json();
                    this.renderCard(container, product);
                } catch (e) { console.error(`Ошибка ${file}:`, e); }
            }
            if (container.children.length === 0) container.innerHTML = '<p style="text-align:center;">Товары не найдены.</p>';
        } catch (e) {
            console.error('Ошибка загрузки:', e);
            container.innerHTML = '<p style="text-align:center; color:red;">Ошибка загрузки каталога.</p>';
        }
    },

    renderCard(container, product) {
        const imgPath = `images/${product.id}.jpg`;
        const card = document.createElement('div');
        card.className = 'product-card';
        card.dataset.id = product.id;
        card.dataset.name = product.name;
        card.dataset.price = product.price;

        card.innerHTML = `
            <div class="product-image-wrap">
                <img src="${imgPath}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/300x200?text=Нет+фото'">
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-description">${product.description || ''}</p>
                ${product.specs ? `<ul class="product-specs" style="font-size:13px; color:var(--text-light); margin-bottom:10px;">${product.specs.map(s=>`<li>${s}</li>`).join('')}</ul>` : ''}
                <div class="product-price-row">
                    <span class="price">${Utils.formatPrice(product.price)}</span>
                    <button class="btn-add" data-id="${product.id}" data-name="${product.name}" data-price="${product.price}">В корзину</button>
                </div>
            </div>`;
        container.appendChild(card);
    }
};