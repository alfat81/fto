require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ['https://fabrika-mebeli.github.io', 'http://localhost:8080'], // Замените на ваш GitHub Pages URL
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json({
  limit: '10mb'
}));

app.use(express.urlencoded({
  extended: true,
  limit: '10mb'
}));

// Проверка конфигурации
const requiredEnvVars = ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.warn('⚠️ Внимание! Отсутствуют следующие переменные окружения:');
  missingVars.forEach(varName => console.warn(`- ${varName}`));
  console.warn('Пожалуйста, установите их в настройках Render.com');
}

// Форматирование заказа для Telegram
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

📍 Адрес доставки: ул. Тургенева, 9, Нижний Новгород
📞 Контактный телефон для связи: +7 (960) 178-67-38
✉️ Email: a20072005@yandex.ru
  `.trim();
}

// Отправка сообщения в Telegram
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

    const result = await response.json();
    
    if (!response.ok || !result.ok) {
      console.error('❌ Ошибка при отправке в Telegram:', result);
      throw new Error(result.description || 'Неизвестная ошибка Telegram API');
    }
    
    console.log('✅ Сообщение успешно отправлено в Telegram');
    return result;
  } catch (error) {
    console.error('❌ Критическая ошибка при отправке в Telegram:', error);
    throw error;
  }
}

// API эндпоинты
app.post('/api/order', async (req, res) => {
  try {
    console.log('📡 Получен новый заказ:', req.body);
    
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
    const telegramResult = await sendTelegramMessage(message);
    
    console.log('✅ Заказ успешно обработан');
    
    // Отправка ответа клиенту
    res.status(200).json({
      success: true,
      message: 'Заказ успешно отправлен! Менеджер свяжется с вами в ближайшее время.',
      orderId: order.orderId,
      telegramMessageId: telegramResult?.result?.message_id
    });
    
    // Логирование успешного заказа
    console.log(`🎉 Успешный заказ: ${order.orderId}, сумма: ${order.total.toLocaleString('ru-RU')} ₽`);
    
  } catch (error) {
    console.error('❌ Ошибка при обработке заказа:', error);
    
    // Отправка ошибки клиенту
    res.status(500).json({ 
      error: error.message || 'Ошибка при обработке заказа',
      success: false,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    
    // Попытка отправить уведомление об ошибке в Telegram
    try {
      if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
        await sendTelegramMessage(`
🚨 КРИТИЧЕСКАЯ ОШИБКА В СИСТЕМЕ ЗАКАЗОВ

❌ Ошибка: ${error.message}
🕐 Время: ${new Date().toLocaleString('ru-RU')}
💻 Детали: ${error.stack?.slice(0, 500) || 'Нет деталей'}

Пожалуйста, проверьте логи сервера!
        `);
      }
    } catch (telegramError) {
      console.error('❌ Не удалось отправить уведомление об ошибке в Telegram:', telegramError);
    }
  }
});

// Health check эндпоинт
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    telegramConfigured: !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID)
  });
});

// Root эндпоинт
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Backend для Фабрики торгового оборудования',
    api: {
      order: 'POST /api/order',
      health: 'GET /health'
    },
    documentation: 'https://github.com/yourusername/fabrika-mebeli-backend'
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
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log('🔧 Конфигурация:');
  console.log(`- Telegram Bot Token: ${process.env.TELEGRAM_BOT_TOKEN ? '✅ Настроен' : '❌ Не настроен'}`);
  console.log(`- Telegram Chat ID: ${process.env.TELEGRAM_CHAT_ID ? '✅ Настроен' : '❌ Не настроен'}`);
  console.log(`- CORS origin: ${process.env.CORS_ORIGIN || 'https://fabrika-mebeli.github.io'}`);
  
  // Тестовое сообщение при запуске
  if (process.env.NODE_ENV === 'production' && process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    sendTelegramMessage(`
✅ СИСТЕМА УСПЕШНО ЗАПУЩЕНА

🕐 Время запуска: ${new Date().toLocaleString('ru-RU')}
⚙️ Версия: 1.0.0
📍 Сервер: Render.com
🔗 URL: ${process.env.RENDER_EXTERNAL_URL || 'https://your-render-app.onrender.com'}

Система готова принимать заказы!
    `).catch(console.error);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Получен сигнал SIGTERM. Завершение работы...');
  
  sendTelegramMessage(`
⚠️ СИСТЕМА ЗАВЕРШАЕТ РАБОТУ

🕐 Время: ${new Date().toLocaleString('ru-RU')}
⚙️ Причина: SIGTERM signal
📍 Сервер: Render.com

Все текущие заказы будут обработаны.
    `).finally(() => {
      process.exit(0);
    });
});

module.exports = app;
