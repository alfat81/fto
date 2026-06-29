/**
 * admin.js — Логика админки каталога ФТО.
 *
 * Подход:
 *   Сайт статичный (GitHub Pages), backend для каталога не предусмотрен.
 *   Поэтому админка работает целиком в браузере:
 *     1. Менеджер открывает admin.html
 *     2. Импортирует существующие товары (опционально) через выбор JSON-файлов
 *     3. Добавляет / редактирует / удаляет товары через форму
 *     4. Состояние хранится в localStorage (не теряется при перезагрузке)
 *     5. По готовности нажимает «Скачать все товары» → получает ZIP-архив
 *        со всеми JSON-файлами + index.json
 *     6. Распаковывает архив и копирует файлы в docs/data/products/ репозитория
 *     7. Коммитит в Git и пушит на GitHub — каталог обновляется автоматически
 *
 * Архитектура:
 *   - AdminModule.products = [] — массив товаров в памяти
 *   - localStorage['fto_admin_products'] — постоянное хранилище
 *   - JSZip — для скачивания архива (подключён через cdnjs)
 *   - download() — для скачивания index.json отдельно
 */

const AdminModule = (function() {

    const STORAGE_KEY = 'fto_admin_products';
    const CATEGORY_NAMES = {
        1: 'Торговые стеллажи',
        2: 'Витрины и прилавки',
        3: 'Кассовые боксы',
        4: 'Кресла и стулья'
    };

    let products = [];
    let originalIds = new Set(); // ID товаров, которые были импортированы (не удалены/не изменены)
    let modifiedIds = new Set(); // ID товаров, которые были изменены
    let editingId = null; // ID редактируемого товара (null = создание нового)

    // ━━ Init ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    function init() {
        loadFromStorage();
        renderAll();
    }

    // ━━ Storage ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    function loadFromStorage() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                products = JSON.parse(stored);
                originalIds = new Set(products.map(p => p.id));
            }
        } catch (e) {
            console.error('loadFromStorage error:', e);
            products = [];
        }
    }

    function saveToStorage() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
        } catch (e) {
            console.error('saveToStorage error:', e);
            alert('Не удалось сохранить в localStorage. Возможно, превышен лимит (5 МБ).');
        }
    }

    // ━━ Render ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    function renderAll() {
        renderStats();
        renderList();
    }

    function renderStats() {
        document.getElementById('stat-total').textContent = products.length;
        for (let i = 1; i <= 4; i++) {
            const count = products.filter(p => Number(p.category) === i).length;
            document.getElementById(`stat-cat${i}`).textContent = count;
        }
        document.getElementById('stat-modified').textContent = modifiedIds.size;
    }

    function renderList() {
        const container = document.getElementById('products-container');
        if (products.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-box-open"></i>
                    <p>Товаров пока нет.<br>Нажмите «Импорт JSON» чтобы загрузить существующие товары,<br>или «Добавить товар» чтобы создать первый.</p>
                </div>`;
            return;
        }

        // Сортировка: по категории, потом по ID
        const sorted = [...products].sort((a, b) => {
            const catDiff = Number(a.category) - Number(b.category);
            if (catDiff !== 0) return catDiff;
            return String(a.id).localeCompare(String(b.id), undefined, { numeric: true });
        });

        container.innerHTML = sorted.map(p => {
            const imgSrc = p.image || `images/${p.id}.jpg`;
            const catName = CATEGORY_NAMES[p.category] || `Категория ${p.category}`;
            const modified = modifiedIds.has(p.id) ? '<span style="color: var(--warning); font-size: 11px; margin-left: 6px;">● изменён</span>' : '';
            return `
                <div class="product-row ${editingId === p.id ? 'editing' : ''}" data-id="${escapeAttr(p.id)}">
                    <div class="product-thumb placeholder">
                        <img class="product-thumb" src="${escapeAttr(imgSrc)}" alt="" onerror="this.style.display='none'; this.parentElement.classList.add('placeholder'); this.parentElement.innerHTML='<i class=\\'fas fa-image\\'></i>'">
                    </div>
                    <div class="product-info">
                        <div class="name">${escapeHtml(p.name)}${modified}</div>
                        <div class="meta">
                            <span class="id">${escapeHtml(p.id)}</span>
                            <span class="price">${formatPrice(p.price)}</span>
                            <span>${escapeHtml(catName)}</span>
                            ${p.old_price ? `<span style="text-decoration: line-through; opacity: 0.6;">${formatPrice(p.old_price)}</span>` : ''}
                        </div>
                    </div>
                    <div class="product-actions">
                        <button class="btn-admin btn-admin-secondary btn-admin-sm" onclick="AdminModule.editProduct('${escapeAttr(p.id)}')"><i class="fas fa-edit"></i></button>
                        <button class="btn-admin btn-admin-danger btn-admin-sm" onclick="AdminModule.confirmDelete('${escapeAttr(p.id)}')"><i class="fas fa-trash"></i></button>
                    </div>
                </div>`;
        }).join('');
    }

    // ━━ Form: Add / Edit ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    function openAddForm() {
        editingId = null;
        clearForm();
        document.getElementById('form-title').textContent = 'Новый товар';
        document.getElementById('btn-delete').style.display = 'none';
        document.getElementById('product-form-wrap').style.display = 'block';
        // Скролл к форме на мобильных
        document.getElementById('product-form-wrap').scrollIntoView({ behavior: 'smooth', block: 'start' });
        renderList();
    }

    function editProduct(id) {
        const p = products.find(x => x.id === id);
        if (!p) return;
        editingId = id;
        document.getElementById('form-title').textContent = `Редактирование: ${p.name}`;
        document.getElementById('pf-original-id').value = id;
        document.getElementById('pf-id').value = p.id || '';
        document.getElementById('pf-name').value = p.name || '';
        document.getElementById('pf-category').value = p.category || '1';
        document.getElementById('pf-price').value = p.price || '';
        document.getElementById('pf-old-price').value = p.old_price || '';
        document.getElementById('pf-image').value = p.image || '';
        document.getElementById('pf-description').value = p.description || '';
        updateImagePreview();
        renderSpecs(p.specs || {});
        document.getElementById('btn-delete').style.display = 'inline-flex';
        document.getElementById('product-form-wrap').style.display = 'block';
        document.getElementById('product-form-wrap').scrollIntoView({ behavior: 'smooth', block: 'start' });
        renderList();
    }

    function closeForm() {
        editingId = null;
        document.getElementById('product-form-wrap').style.display = 'none';
        clearForm();
        renderList();
    }

    function clearForm() {
        document.getElementById('pf-original-id').value = '';
        document.getElementById('pf-id').value = '';
        document.getElementById('pf-name').value = '';
        document.getElementById('pf-category').value = '1';
        document.getElementById('pf-price').value = '';
        document.getElementById('pf-old-price').value = '';
        document.getElementById('pf-image').value = '';
        document.getElementById('pf-description').value = '';
        document.getElementById('pf-image-preview').classList.remove('show');
        document.getElementById('pf-image-preview').src = '';
        renderSpecs({});
    }

    function saveProduct() {
        const id = document.getElementById('pf-id').value.trim();
        const name = document.getElementById('pf-name').value.trim();
        const category = Number(document.getElementById('pf-category').value);
        const price = Number(document.getElementById('pf-price').value);
        const oldPrice = document.getElementById('pf-old-price').value;
        const image = document.getElementById('pf-image').value.trim();
        const description = document.getElementById('pf-description').value.trim();

        if (!id) { alert('Укажите ID товара'); return; }
        if (!name) { alert('Укажите название товара'); return; }
        if (!price || price <= 0) { alert('Укажите корректную цену'); return; }

        // Проверка уникальности ID
        const originalId = document.getElementById('pf-original-id').value;
        const exists = products.find(p => p.id === id && p.id !== originalId);
        if (exists) {
            if (!confirm(`Товар с ID "${id}" уже существует. Перезаписать?`)) return;
            // Удаляем существующий
            products = products.filter(p => p.id !== id);
        }

        // Собираем характеристики из формы
        const specs = collectSpecs();

        const product = {
            id: id,
            category: category,
            name: name,
            price: price,
            ...(oldPrice ? { old_price: Number(oldPrice) } : {}),
            ...(image ? { image: image } : {}),
            description: description,
            specs: specs
        };

        if (editingId) {
            // Редактирование существующего
            const idx = products.findIndex(p => p.id === editingId);
            if (idx >= 0) products[idx] = product;
            modifiedIds.add(id);
        } else {
            // Новый
            products.push(product);
            modifiedIds.add(id);
        }

        saveToStorage();
        renderAll();
        closeForm();
    }

    function confirmDelete(id) {
        const p = products.find(x => x.id === id);
        if (!p) return;
        if (confirm(`Удалить товар "${p.name}" (ID: ${id})?`)) {
            deleteProduct();
        }
    }

    function deleteProduct() {
        if (!editingId) return;
        if (!confirm(`Удалить товар "${editingId}"?`)) return;
        products = products.filter(p => p.id !== editingId);
        modifiedIds.add(editingId);
        saveToStorage();
        renderAll();
        closeForm();
    }

    // ━━ Specs (характеристики) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    function renderSpecs(specs) {
        const container = document.getElementById('pf-specs');
        container.innerHTML = '';
        if (specs && typeof specs === 'object') {
            Object.entries(specs).forEach(([key, val]) => {
                addSpecRow(key, val);
            });
        }
    }

    function addSpecRow(key = '', val = '') {
        const container = document.getElementById('pf-specs');
        const row = document.createElement('div');
        row.className = 'spec-row';
        row.innerHTML = `
            <input type="text" placeholder="Параметр" value="${escapeAttr(key)}">
            <input type="text" placeholder="Значение" value="${escapeAttr(val)}">
            <button class="btn-remove-spec" onclick="this.parentElement.remove()">&times;</button>
        `;
        container.appendChild(row);
    }

    function collectSpecs() {
        const rows = document.querySelectorAll('#pf-specs .spec-row');
        const specs = {};
        rows.forEach(row => {
            const inputs = row.querySelectorAll('input');
            const key = inputs[0].value.trim();
            const val = inputs[1].value.trim();
            if (key && val) specs[key] = val;
        });
        return specs;
    }

    // ━━ Image preview ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    function updateImagePreview() {
        const url = document.getElementById('pf-image').value.trim();
        const img = document.getElementById('pf-image-preview');
        if (url) {
            img.src = url;
            img.classList.add('show');
        } else {
            img.classList.remove('show');
            img.src = '';
        }
    }

    // ━━ Import ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    function importJson(event) {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const loaded = [];
        let processed = 0;
        const total = files.length;

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    // Пропускаем index.json
                    if (file.name === 'index.json') {
                        processed++;
                        if (processed === total) finishImport(loaded);
                        return;
                    }
                    if (data.id && data.name && data.price) {
                        loaded.push(data);
                    } else {
                        console.warn(`Файл ${file.name} пропущен: нет обязательных полей id/name/price`);
                    }
                } catch (err) {
                    console.error(`Ошибка чтения ${file.name}:`, err);
                }
                processed++;
                if (processed === total) finishImport(loaded);
            };
            reader.readAsText(file);
        });

        event.target.value = ''; // сбрасываем input
    }

    function finishImport(loaded) {
        if (loaded.length === 0) {
            alert('Не удалось загрузить товары. Проверьте формат JSON-файлов.');
            return;
        }
        // Merge: заменяем существующие по ID, добавляем новые
        let added = 0, updated = 0;
        loaded.forEach(item => {
            const idx = products.findIndex(p => p.id === item.id);
            if (idx >= 0) {
                products[idx] = item;
                updated++;
            } else {
                products.push(item);
                added++;
            }
            originalIds.add(item.id);
        });
        saveToStorage();
        renderAll();
        alert(`Импортировано: ${loaded.length} товаров.\nДобавлено новых: ${added}\nОбновлено: ${updated}`);
    }

    // ━━ Export ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    function exportAll() {
        if (products.length === 0) {
            alert('Нет товаров для экспорта');
            return;
        }

        // Проверяем, загружен ли JSZip
        if (typeof JSZip === 'undefined') {
            // Подгружаем динамически
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
            script.onload = () => doExportAll();
            script.onerror = () => alert('Не удалось загрузить JSZip. Проверьте интернет-соединение.');
            document.head.appendChild(script);
        } else {
            doExportAll();
        }
    }

    async function doExportAll() {
        const zip = new JSZip();
        const productsFolder = zip.folder('products');

        // Имена файлов: используем ID + .json. Если ID содержит '/', заменяем на '_'
        const fileNames = [];

        products.forEach(p => {
            const safeId = String(p.id).replace(/[\/\\]/g, '_');
            const fileName = `${safeId}.json`;
            fileNames.push(fileName);
            // Сериализуем с отступами, без BOM
            const json = JSON.stringify(p, null, 2);
            productsFolder.file(fileName, json);
        });

        // index.json — список файлов в алфавитном порядке
        fileNames.sort();
        productsFolder.file('index.json', JSON.stringify(fileNames, null, 2));

        // README.txt с инструкцией
        const readme = `Каталог товаров ФТО
====================

Этот архив содержит ${products.length} товаров в формате JSON.

КАК ОБНОВИТЬ КАТАЛОГ НА САЙТЕ:

1. Распакуйте архив — внутри будет папка "products/" с JSON-файлами
2. Откройте репозиторий сайта на GitHub: https://github.com/alfat81/fto
3. Перейдите в папку docs/data/products/
4. Удалите все старые .json файлы (кроме index.json)
5. Загрузите все файлы из распакованной папки "products/" (включая новый index.json)
6. Через 1-2 минуты каталог на сайте обновится автоматически

АЛЬТЕРНАТИВНО (через Git):
1. Склонируйте репозиторий: git clone https://github.com/alfat81/fto
2. Замените содержимое docs/data/products/ файлами из этого архива
3. Сделайте коммит: git add . && git commit -m "Update catalog: ${products.length} products"
4. Запушьте: git push origin main

ИЗОБРАЖЕНИЯ:
Каждый товар использует images/{ID}.jpg как изображение по умолчанию.
Если у товара указано поле "image", используется указанный путь.
Не забудьте загрузить соответствующие изображения в docs/images/.

Дата экспорта: ${new Date().toLocaleString('ru-RU')}
Всего товаров: ${products.length}
`;
        zip.file('README.txt', readme);

        // Генерируем и скачиваем
        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const date = new Date().toISOString().slice(0, 10);
        a.download = `fto-catalog-${date}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Сбрасываем флаг изменений
        modifiedIds.clear();
        renderStats();
    }

    function exportIndex() {
        if (products.length === 0) {
            alert('Нет товаров для экспорта');
            return;
        }
        const fileNames = products.map(p => `${String(p.id).replace(/[\/\\]/g, '_')}.json`).sort();
        const json = JSON.stringify(fileNames, null, 2);
        downloadFile(json, 'index.json', 'application/json');
    }

    function downloadFile(content, fileName, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // ━━ Utils ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    function escapeHtml(s) {
        if (s === null || s === undefined) return '';
        return String(s).replace(/[&<>"']/g, m => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[m]));
    }

    function escapeAttr(s) {
        return escapeHtml(s);
    }

    function formatPrice(p) {
        if (!p) return '0 ₽';
        return new Intl.NumberFormat('ru-RU').format(p) + ' ₽';
    }

    // ━━ Публичный API ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    return {
        init,
        openAddForm,
        editProduct,
        closeForm,
        saveProduct,
        confirmDelete,
        deleteProduct,
        addSpecRow,
        importJson,
        exportAll,
        exportIndex
    };
})();

// Старт
document.addEventListener('DOMContentLoaded', AdminModule.init);

// Live update image preview
document.addEventListener('input', (e) => {
    if (e.target.id === 'pf-image') {
        AdminModule.updateImagePreview && AdminModule.updateImagePreview();
        const url = e.target.value.trim();
        const img = document.getElementById('pf-image-preview');
        if (url) {
            img.src = url;
            img.classList.add('show');
        } else {
            img.classList.remove('show');
            img.src = '';
        }
    }
});
