/**
 * products-loader.js
 * Модуль для динамической загрузки товаров из JSON файлов.
 */

const ProductsLoader = (function() {
    
    /**
     * Загружает список товаров и рендерит их в контейнер
     * @param {string} containerSelector - CSS селектор контейнера (например, '#catalog-grid')
     * @param {string} indexPath - Путь к index.json со списком файлов
     */
    async function loadProducts(containerSelector, indexPath = 'data/products/index.json') {
        const container = document.querySelector(containerSelector);
        if (!container) {
            console.error('Контейнер для товаров не найден:', containerSelector);
            return;
        }

        try {
            // 1. Получаем список файлов
            const response = await fetch(indexPath);
            if (!response.ok) throw new Error('Не удалось загрузить индекс товаров');
            const fileNames = await response.json();

            // 2. Загружаем каждый файл параллельно
            const promises = fileNames.map(name => 
                fetch(`data/products/${name}`).then(res => res.json())
            );

            const products = await Promise.all(promises);

            // 3. Очищаем контейнер (убираем лоадер, если есть)
            container.innerHTML = '';

            // 4. Рендерим карточки
            if (products.length === 0) {
                container.innerHTML = '<p>Товары пока не добавлены.</p>';
                return;
            }

            products.forEach(product => {
                const card = createProductCard(product);
                container.appendChild(card);
            });

            // 5. Сообщаем приложению, что товары загружены (для пересчета корзины, если нужно)
            if (typeof CartModule !== 'undefined') {
                CartModule.updateUI();
            }

        } catch (error) {
            console.error('Ошибка загрузки товаров:', error);
            container.innerHTML = `
                <div style="color: red; text-align: center; padding: 20px;">
                    <h3>Ошибка загрузки каталога</h3>
                    <p>Проверьте консоль браузера или наличие файла index.json</p>
                </div>
            `;
        }
    }

    /**
     * Создает HTML элемент карточки товара
     */
    function createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'product-card';
        // Добавляем data-атрибуты для скрипта корзины
        card.dataset.id = product.id;
        card.dataset.name = product.name;
        card.dataset.price = product.price;
        card.dataset.image = product.image || '';

        // Форматируем цену
        const formattedPrice = new Intl.NumberFormat('ru-RU').format(product.price);

        // Если картинки нет, ставим заглушку
        const imageSrc = product.image ? product.image : 'https://via.placeholder.com/300x200?text=Нет+фото';

        card.innerHTML = `
            <div class="product-image" style="height: 200px; background: #f9f9f9; display: flex; align-items: center; justify-content: center; overflow: hidden; margin-bottom: 15px;">
                <img src="${imageSrc}" alt="${product.name}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
            </div>
            <h3 class="product-title" style="font-size: 1.1em; margin: 10px 0;">${product.name}</h3>
            <p class="product-desc" style="color: #666; font-size: 0.9em; margin-bottom: 10px; height: 40px; overflow: hidden;">${product.description}</p>
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px;">
                <span style="font-size: 1.2em; font-weight: bold; color: #333;">${formattedPrice} ₽</span>
                <button class="btn btn-add-to-cart" style="background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                    В корзину
                </button>
            </div>
            
            ${renderSpecs(product.specs)}
        `;

        return card;
    }

    /**
     * Рендерит характеристики (опционально)
     */
    function renderSpecs(specs) {
        if (!specs) return '';
        let html = '<div style="margin-top: 10px; font-size: 0.85em; color: #555; border-top: 1px solid #eee; padding-top: 5px;">';
        for (const [key, value] of Object.entries(specs)) {
            // Превращаем key из snake_case в читаемый текст, если нужно
            const label = key.replace(/_/g, ' '); 
            html += `<div><b>${label}:</b> ${value}</div>`;
        }
        html += '</div>';
        return html;
    }

    return {
        loadProducts
    };
})();