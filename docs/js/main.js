// Инициализация корзины
let cart = JSON.parse(localStorage.getItem('cart')) || [];
const API_URL = 'https://fto-tdks.onrender.com/api/order';

// Отладочная информация при загрузке
console.log('🚀 Сайт фабрики торгового оборудования загружен');
console.log('🛒 Корзина инициализирована:', cart.length, 'товаров');
console.log('🌐 API URL:', API_URL);
console.log('📱 Origin:', window.location.origin);
console.log('🔍 Тест CORS:', checkCorsSupport());
console.log('⚙️ Версия скрипта: 2.1.0');

// Проверка поддержки CORS
function checkCorsSupport() {
  return 'withCredentials' in new XMLHttpRequest() ? 'Поддерживается' : 'Не поддерживается';
}

// Обновление отображения корзины
function updateCartDisplay() {
  const cartCountElement = document.getElementById('cart-count');
  if (cartCountElement) {
    cartCountElement.textContent = cart.length;
  }
  
  const cartItemsContainer = document.getElementById('cart-items');
  if (!cartItemsContainer) return;
  
  cartItemsContainer.innerHTML = '';
  
  if (cart.length === 0) {
    const emptyMessage = document.createElement('p');
    emptyMessage.className = 'empty-cart';
    emptyMessage.textContent = 'Ваша корзина пуста';
    cartItemsContainer.appendChild(emptyMessage);
    
    const cartTotalElement = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');
    if (cartTotalElement) cartTotalElement.textContent = '0 ₽';
    if (checkoutBtn) checkoutBtn.disabled = true;
    return;
  }
  
  let total = 0;
  cart.forEach((item, index) => {
    total += item.price;
    const itemElement = document.createElement('div');
    itemElement.className = 'cart-item';
    
    // Информация о товаре
    const itemInfo = document.createElement('div');
    itemInfo.className = 'cart-item-info';
    
    const itemName = document.createElement('strong');
    itemName.textContent = item.name;
    itemInfo.appendChild(itemName);
    
    const itemPrice = document.createElement('div');
    itemPrice.className = 'cart-item-price';
    itemPrice.textContent = `${item.price.toLocaleString('ru-RU')} ₽`;
    itemInfo.appendChild(itemPrice);
    
    // Кнопка удаления
    const removeButton = document.createElement('button');
    removeButton.className = 'remove-item';
    removeButton.setAttribute('data-index', index);
    removeButton.title = 'Удалить из корзины';
    
    const trashIcon = document.createElement('i');
    trashIcon.className = 'fas fa-trash';
    removeButton.appendChild(trashIcon);
    
    itemElement.appendChild(itemInfo);
    itemElement.appendChild(removeButton);
    cartItemsContainer.appendChild(itemElement);
  });
  
  const cartTotalElement = document.getElementById('cart-total');
  const checkoutBtn = document.getElementById('checkout-btn');
  if (cartTotalElement) cartTotalElement.textContent = `${total.toLocaleString('ru-RU')} ₽`;
  if (checkoutBtn) checkoutBtn.disabled = false;
  
  // Обработчики удаления
  document.querySelectorAll('.remove-item').forEach(button => {
    button.addEventListener('click', function() {
      const index = this.getAttribute('data-index');
      removeFromCart(index);
    });
  });
}

// Удаление товара из корзины
function removeFromCart(index) {
  cart.splice(index, 1);
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartDisplay();
  showToast('Товар удален из корзины', 'success');
}

// Добавление товара в корзину
function addToCart(product) {
  cart.push(product);
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartDisplay();
  
  showToast('Товар добавлен в корзину!', 'success', 3000);
  
  // Анимация кнопки корзины
  const cartBtn = document.getElementById('cart-btn');
  if (cartBtn) {
    cartBtn.style.transform = 'scale(1.2)';
    setTimeout(() => {
      cartBtn.style.transform = 'scale(1)';
    }, 300);
  }
}

// Отправка заказа на сервер
async function sendOrderToServer(orderData) {
  console.log('📤 Отправка заказа на сервер:', orderData);
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData)
    });
    
    console.log('📨 Ответ сервера:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Ошибка от сервера:', errorData);
      throw new Error(errorData.message || `Ошибка ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('✅ Успешный ответ от сервера:', result);
    return result;
  } catch (error) {
    console.error('🔥 Критическая ошибка при отправке заказа:', error);
    throw error;
  }
}

// Оформление заказа
const checkoutForm = document.getElementById('checkout-form');
if (checkoutForm) {
  checkoutForm.addEventListener('submit', function(e) {
    e.preventDefault();
    handleOrderSubmission();
  });
}

// Обработка отправки заказа
async function handleOrderSubmission() {
  if (cart.length === 0) {
    showToast('Корзина пуста! Добавьте товары для оформления заказа.', 'error');
    return;
  }
  
  const phoneElement = document.getElementById('phone');
  const nameElement = document.getElementById('name');
  const commentElement = document.getElementById('comment');
  
  if (!phoneElement || !nameElement) {
    showToast('Ошибка: отсутствуют необходимые поля формы', 'error');
    return;
  }
  
  const phone = phoneElement.value.trim();
  const name = nameElement.value.trim();
  const comment = commentElement ? commentElement.value.trim() : '';
  
  // Валидация телефона
  if (!phone || !/^\+?7[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}$/.test(phone.replace(/\D/g, ''))) {
    showToast('Пожалуйста, введите корректный номер телефона в формате +7 (999) 123-45-67', 'error');
    phoneElement.focus();
    return;
  }
  
  // Валидация имени
  if (!name || name.length < 2) {
    showToast('Пожалуйста, введите ваше имя (минимум 2 символа)', 'error');
    nameElement.focus();
    return;
  }
  
  const order = {
    items: cart,
    customer: {
      name: name,
      phone: phone,
      comment: comment
    },
    total: calculateTotal(cart),
    date: new Date().toISOString()
  };
  
  const checkoutBtn = document.getElementById('checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.disabled = true;
    checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
  }
  
  try {
    console.log('📋 Формирование заказа:', order);
    
    const result = await sendOrderToServer(order);
    
    // Очистка корзины после успешного заказа
    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
    
    // Очистка формы
    if (checkoutForm) checkoutForm.reset();
    
    // Закрытие модального окна
    const cartModal = document.getElementById('cart-modal');
    if (cartModal) cartModal.style.display = 'none';
    
    // Показать сообщение об успехе
    showToast('✅ Заказ успешно отправлен!\nМенеджер свяжется с вами в ближайшее время.', 'success', 5000);
    
    // Аналитика - отправка события в Яндекс.Метрику (если подключена)
    if (window.ym) {
      window.ym(99999999, 'reachGoal', 'ORDER_SUCCESS');
    }
    
  } catch (error) {
    console.error('❌ Ошибка при оформлении заказа:', error);
    
    // Попытка отправить ошибку в Telegram для отладки
    try {
      await sendDebugMessageToTelegram(error, order);
    } catch (debugError) {
      console.error('❌ Не удалось отправить отладочное сообщение:', debugError);
    }
    
    showToast(`❌ Ошибка при отправке заказа: ${error.message}\nПопробуйте снова или позвоните по телефону +7 (960) 178-67-38`, 'error', 7000);
  } finally {
    // Восстановить кнопку
    if (checkoutBtn) {
      checkoutBtn.disabled = false;
      checkoutBtn.innerHTML = 'Оформить заказ';
    }
  }
}

// Отправка отладочного сообщения в Telegram
async function sendDebugMessageToTelegram(error, orderData) {
  if (!orderData || !error) return;
  
  const debugMessage = `
🚨 ОТЛАДКА ОШИБКИ ЗАКАЗА

❌ Ошибка: ${error.message}
⏰ Время: ${new Date().toLocaleString('ru-RU')}
📋 Данные заказа:
- Товары: ${orderData.items.length}
- Сумма: ${orderData.total.toLocaleString('ru-RU')} ₽
- Имя клиента: ${orderData.customer.name}
- Телефон: ${orderData.customer.phone}
- Сайт: ${window.location.href}
- User Agent: ${navigator.userAgent}
  `.trim();
  
  console.log('📨 Отправка отладочного сообщения в Telegram');
  
  // Отправка через тот же API endpoint
  await fetch(API_URL.replace('/order', '/debug-error'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ debugMessage })
  });
}

// Вспомогательная функция расчета итога
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// Показать уведомление (безопасно для CSP)
function showToast(message, type = 'info', duration = 3000) {
  // Создать контейнер для тостов, если его нет
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.position = 'fixed';
    toastContainer.style.top = '20px';
    toastContainer.style.right = '20px';
    toastContainer.style.zIndex = '9999';
    toastContainer.style.maxWidth = '350px';
    document.body.appendChild(toastContainer);
  }
  
  // Создать тост
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  // Установить стили
  const backgroundColor = type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8';
  toast.style.background = backgroundColor;
  toast.style.color = 'white';
  toast.style.padding = '15px 20px';
  toast.style.borderRadius = '8px';
  toast.style.marginBottom = '10px';
  toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
  toast.style.animation = `slideIn 0.3s, fadeOut 0.5s ${duration}ms forwards`;
  toast.style.maxWidth = '100%';
  toast.style.wordWrap = 'break-word';
  toast.style.fontFamily = 'Arial, sans-serif';
  
  toast.textContent = message;
  
  // Добавить иконку в зависимости от типа
  const icon = document.createElement('i');
  icon.className = type === 'success' ? 'fas fa-check-circle' : type === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-info-circle';
  icon.style.marginRight = '10px';
  icon.style.fontSize = '1.2em';
  
  const iconContainer = document.createElement('span');
  iconContainer.style.display = 'flex';
  iconContainer.style.alignItems = 'center';
  iconContainer.appendChild(icon);
  iconContainer.appendChild(document.createTextNode(message));
  
  toast.innerHTML = '';
  toast.appendChild(iconContainer);
  
  // Добавить в контейнер
  toastContainer.appendChild(toast);
  
  // Функция для удаления тоста
  function removeToast() {
    toast.style.animation = 'fadeOut 0.5s forwards';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 500);
  }
  
  // Удалить после анимации
  setTimeout(removeToast, duration);
}

// Функция отладки отправки заказа
function debugOrderSubmission() {
  console.log('🔧 === ОТЛАДКА ОТПРАВКИ ЗАКАЗА ===');
  console.log('🛒 Текущая корзина:', JSON.parse(JSON.stringify(cart)));
  console.log('🌐 API URL:', API_URL);
  console.log('📱 Текущий origin:', window.location.origin);
  console.log('🔍 Тест CORS:', checkCorsSupport());
  
  // Проверка доступности бэкенда
  fetch(`${API_URL.replace('/order', '/health')}`, {
    method: 'GET',
    mode: 'cors'
  })
  .then(response => {
    if (response.ok) {
      return response.json();
    } else {
      throw new Error(`Статус: ${response.status} ${response.statusText}`);
    }
  })
  .then(data => {
    console.log('✅ Бэкенд доступен:', data);
    showToast(`✅ Бэкенд работает. Версия: ${data.version}`, 'success');
  })
  .catch(error => {
    console.error('❌ Ошибка подключения к бэкенду:', error);
    showToast(`❌ Бэкенд недоступен: ${error.message}`, 'error');
  });
  
  // Проверка CORS
  fetch(API_URL, {
    method: 'OPTIONS',
    mode: 'cors'
  })
  .then(response => {
    console.log('🔐 CORS заголовки:', {
      'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
      'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
      'access-control-allow-headers': response.headers.get('access-control-allow-headers')
    });
  })
  .catch(error => {
    console.error('❌ Ошибка проверки CORS:', error);
  });
}

// Обработчики для модального окна
const cartBtn = document.getElementById('cart-btn');
if (cartBtn) {
  cartBtn.addEventListener('click', function(e) {
    e.preventDefault();
    const cartModal = document.getElementById('cart-modal');
    if (cartModal) {
      cartModal.style.display = 'flex';
      updateCartDisplay();
    }
  });
}

const closeBtn = document.querySelector('.close');
if (closeBtn) {
  closeBtn.addEventListener('click', function() {
    const cartModal = document.getElementById('cart-modal');
    if (cartModal) cartModal.style.display = 'none';
  });
}

window.addEventListener('click', function(e) {
  const cartModal = document.getElementById('cart-modal');
  if (cartModal && e.target === cartModal) {
    cartModal.style.display = 'none';
  }
});

// Закрытие модального окна по нажатию Esc
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    const cartModal = document.getElementById('cart-modal');
    if (cartModal) cartModal.style.display = 'none';
  }
});

// Функция инициализации кнопок добавления в корзину
function initAddToCartButtons() {
  document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', function() {
      const product = {
        id: this.getAttribute('data-id'),
        name: this.getAttribute('data-name'),
        price: parseInt(this.getAttribute('data-price')) || 0,
        image: this.getAttribute('data-image') || ''
      };
      addToCart(product);
    });
  });
}

// Функция отладки сети
function debugNetwork() {
  console.log('📡 === ДЕТАЛЬНАЯ ОТЛАДКА СЕТИ ===');
  console.log('🌐 window.location:', window.location);
  console.log('📱 navigator.userAgent:', navigator.userAgent);
  console.log('🔌 navigator.onLine:', navigator.onLine);
  
  // Проверка подключения к интернету
  if (!navigator.onLine) {
    showToast('❌ Нет подключения к интернету. Проверьте соединение.', 'error');
    return;
  }
  
  // Тестовый запрос к API
  fetch('https://api.github.com/rate_limit', {
    method: 'GET',
    mode: 'cors'
  })
  .then(response => {
    if (response.ok) {
      console.log('✅ GitHub API доступен - интернет работает');
      return response.json();
    } else {
      throw new Error('GitHub API недоступен');
    }
  })
  .then(data => {
    console.log('📊 GitHub Rate Limit:', data);
    showToast('✅ Интернет соединение работает корректно', 'success');
  })
  .catch(error => {
    console.error('❌ Ошибка подключения к GitHub API:', error);
    showToast('⚠️ Проблемы с интернет соединением', 'error');
  });
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
  console.log('✅ DOM загружен полностью');
  
  updateCartDisplay();
  initAddToCartButtons();
  
  // Добавить обработчик для динамически добавляемых кнопок
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('add-to-cart')) {
      const product = {
        id: e.target.getAttribute('data-id'),
        name: e.target.getAttribute('data-name'),
        price: parseInt(e.target.getAttribute('data-price')) || 0,
        image: e.target.getAttribute('data-image') || ''
      };
      addToCart(product);
    }
  });
  
  // Плавная прокрутка
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        window.scrollTo({
          top: target.offsetTop - 80,
          behavior: 'smooth'
        });
      }
    });
  });
  
  // Эффект при прокрутке для хедера
  window.addEventListener('scroll', function() {
    const header = document.querySelector('header');
    if (header) {
      if (window.scrollY > 100) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }
  });
  
  // Анимация появления элементов при прокрутке
  const parallaxItems = document.querySelectorAll('.parallax-item');
  
  function checkScroll() {
    parallaxItems.forEach(item => {
      const itemPosition = item.getBoundingClientRect().top;
      const screenPosition = window.innerHeight / 1.3;
      
      if (itemPosition < screenPosition) {
        item.classList.add('visible');
      }
    });
  }
  
  // Проверка при прокрутке
  window.addEventListener('scroll', checkScroll);
  checkScroll(); // Проверить сразу при загрузке
  
  // Добавление отладочных кнопок (только для разработки)
  if (window.location.hostname === 'localhost' || window.location.hostname.includes('github.io')) {
    addDebugButtons();
  }
});

// Добавление отладочных кнопок
function addDebugButtons() {
  const debugContainer = document.createElement('div');
  debugContainer.style.position = 'fixed';
  debugContainer.style.bottom = '20px';
  debugContainer.style.left = '20px';
  debugContainer.style.zIndex = '1000';
  debugContainer.style.backgroundColor = 'rgba(0,0,0,0.7)';
  debugContainer.style.padding = '10px';
  debugContainer.style.borderRadius = '10px';
  debugContainer.style.display = 'flex';
  debugContainer.style.gap = '10px';
  debugContainer.style.flexWrap = 'wrap';
  
  const debugBtn = document.createElement('button');
  debugBtn.textContent = 'Отладить заказ';
  debugBtn.style.padding = '8px 12px';
  debugBtn.style.backgroundColor = '#3498db';
  debugBtn.style.color = 'white';
  debugBtn.style.border = 'none';
  debugBtn.style.borderRadius = '5px';
  debugBtn.style.cursor = 'pointer';
  debugBtn.addEventListener('click', debugOrderSubmission);
  
  const networkBtn = document.createElement('button');
  networkBtn.textContent = 'Сеть';
  networkBtn.style.padding = '8px 12px';
  networkBtn.style.backgroundColor = '#2ecc71';
  networkBtn.style.color = 'white';
  networkBtn.style.border = 'none';
  networkBtn.style.borderRadius = '5px';
  networkBtn.style.cursor = 'pointer';
  networkBtn.addEventListener('click', debugNetwork);
  
  const clearBtn = document.createElement('button');
  clearBtn.textContent = 'Очистить корзину';
  clearBtn.style.padding = '8px 12px';
  clearBtn.style.backgroundColor = '#e74c3c';
  clearBtn.style.color = 'white';
  clearBtn.style.border = 'none';
  clearBtn.style.borderRadius = '5px';
  clearBtn.style.cursor = 'pointer';
  clearBtn.addEventListener('click', function() {
    if (confirm('Очистить корзину?')) {
      cart = [];
      localStorage.removeItem('cart');
      updateCartDisplay();
      showToast('Корзина очищена', 'info');
    }
  });
  
  debugContainer.appendChild(debugBtn);
  debugContainer.appendChild(networkBtn);
  debugContainer.appendChild(clearBtn);
  document.body.appendChild(debugContainer);
}

console.log('🎉 main.js успешно инициализирован');
