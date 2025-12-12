// Минимальная рабочая версия корзины
document.addEventListener('DOMContentLoaded', function() {
    // Загрузка корзины из localStorage
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Обновление счетчика корзины
    function updateCartCount() {
        const cartCount = document.getElementById('cart-count');
        if (cartCount) {
            cartCount.textContent = cart.length;
        }
    }
    
    // Добавление товара в корзину
    function addToCart(product) {
        cart.push(product);
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        alert(`Товар "${product.name}" добавлен в корзину!`);
    }
    
    // Инициализация кнопок
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const product = {
                id: this.getAttribute('data-id') || 'product-' + Date.now(),
                name: this.getAttribute('data-name') || 'Без названия',
                price: parseInt(this.getAttribute('data-price')) || 0
            };
            
            addToCart(product);
        });
    });
    
    // Первоначальное обновление счетчика
    updateCartCount();
});
