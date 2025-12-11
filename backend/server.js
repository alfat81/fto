require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 10000;

// Настройка CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'https://alfat81.github.io',
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    nodeVersion: process.version,
    telegramConfigured: !!process.env.TELEGRAM_BOT_TOKEN
  });
});

// Preflight requests
app.options('*', cors(corsOptions));

// Форматирование сообщения для Telegram
function formatOrderMessage(order) {
  const itemsList = order.items.map(item => 
    `📦 ${item.name}\n💰 ${item.price.toLocaleString('ru-RU')} ₽`
  ).join('\n\n');

  return `
🛒 НОВЫЙ ЗАКАЗ #${order.orderId}

📋 ТОВАРЫ:
${itemsList}

💰 ИТОГО: ${order.total.toLocaleString('ru-RU')} ₽

👤 КЛИЕНТ:
👤 Имя: ${order.customer.name}
📱 Телефон: ${order.customer.phone}
💬 Комментарий: ${order.customer.comment || 'Не указан'}

⏰ Дата заказа: ${new Date(order.date).toLocaleString('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}

📍 Адрес: ул. Тургенева, 9, Нижний Новгород
📞 Контактный телефон: +7 (960) 178-67-38
✉️ Email: a20072005@yandex.ru
  `.trim();
}

// Отправка сообщения в Telegram (используем встроенный fetch)
async function sendTelegramMessage(text) {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    console.error('❌ Отсутствуют переменные окружения для Telegram');
    throw new Error('Не настроены параметры Telegram бота');
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  
  const payload = {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML',
    disable_web_page_preview: true
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Ошибка Telegram API:', errorData);
      throw new Error(`Telegram API error: ${errorData.description || 'Unknown error'}`);
    }

    const result = await response.json();
    console.log('✅ Сообщение успешно отправлено в Telegram');
    return result;
  } catch (error) {
    console.error('❌ Критическая ошибка при отправке в Telegram:', error);
    throw error;
  }
}

// API endpoint для заказов
app.post('/api/order', async (req, res) => {
  try {
    console.log('📡 Получен новый заказ:', {
      itemsCount: req.body.items?.length,
      total: req.body.total,
      customerName: req.body.customer?.name
    });
    
    const { items, customer, total, date } = req.body;
    
    // Валидация данных
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        error: 'Отсутствуют товары в заказе',
        success: false
      });
    }
    
    if (!customer?.name || !customer?.phone) {
      return res.status(400).json({ 
        error: 'Отсутствуют данные клиента',
        success: false
      });
    }
    
    if (typeof total !== 'number' || total <= 0) {
      return res.status(400).json({ 
        error: 'Некорректная сумма заказа',
        success: false
      });
    }
    
    // Генерация уникального ID заказа
    const orderId = `ORD-${uuidv4().slice(0, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    
    // Формирование заказа
    const order = {
      orderId,
      items,
      customer,
      total,
      date: date || new Date().toISOString(),
      status: 'new'
    };
    
    // Форматирование сообщения для Telegram
    const message = formatOrderMessage(order);
    
    console.log('📤 Отправка сообщения в Telegram...');
    
    // Отправка в Telegram
    await sendTelegramMessage(message);
    
    console.log('✅ Заказ успешно обработан');
    
    // Отправка ответа клиенту
    res.status(200).json({
      success: true,
      message: 'Заказ успешно отправлен! Менеджер свяжется с вами в ближайшее время.',
      orderId: order.orderId
    });
    
    console.log(`🎉 Успешный заказ: ${order.orderId}, сумма: ${order.total.toLocaleString('ru-RU')} ₽`);
    
  } catch (error) {
    console.error('❌ Ошибка при обработке заказа:', error);
    
    res.status(500).json({ 
      error: 'Ошибка при обработке заказа. Пожалуйста, попробуйте позже.',
      success: false,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
    
    // Отправка уведомления об ошибке в Telegram
    try {
      if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
        await sendTelegramMessage(`
🚨 ОШИБКА ОБРАБОТКИ ЗАКАЗА

❌ Ошибка: ${error.message}
🕐 Время: ${new Date().toLocaleString('ru-RU')}
📋 Данные заказа: ${JSON.stringify(req.body, null, 2)}
        `);
      }
    } catch (telegramError) {
      console.error('❌ Не удалось отправить уведомление об ошибке в Telegram:', telegramError);
    }
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Backend Фабрики торгового оборудования',
    api: {
      order: 'POST /api/order',
      health: 'GET /health'
    },
    documentation: 'https://github.com/alfat81/fto'
  });
});

// Обработка 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Эндпоинт не найден',
    path: req.path,
    method: req.method
  });
});

// Глобальный обработчик ошибок
app.use((err, req, res, next) => {
  console.error('❌ Глобальная ошибка:', err);
  
  res.status(500).json({
    error: 'Внутренняя ошибка сервера',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    success: false
  });
});

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`🌐 URL: http://0.0.0.0:${PORT}`);
  console.log(`✅ CORS origin: ${process.env.CORS_ORIGIN || 'https://alfat81.github.io'}`);
  console.log(`🔧 Node.js version: ${process.version}`);
  
  // Приветственное сообщение в Telegram при запуске
  if (process.env.NODE_ENV === 'production' && process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    const startupMessage = `
✅ СИСТЕМА УСПЕШНО ЗАПУЩЕНА

🕐 Время запуска: ${new Date().toLocaleString('ru-RU')}
⚙️ Версия: 1.0.0
📍 Сервер: Render.com
🔗 URL: ${process.env.RENDER_EXTERNAL_URL || 'https://fto-tdks.onrender.com'}
🎯 Порт: ${PORT}
🔧 Node.js: ${process.version}

Система готова принимать заказы!
    `;
    
    sendTelegramMessage(startupMessage).catch(console.error);
  }
});

module.exports = app;
