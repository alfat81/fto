require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

// Настройка CORS с логированием для отладки
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'https://alfat81.github.io',
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint с подробной информацией
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.1.0',
    nodeVersion: process.version,
    telegramConfigured: !!process.env.TELEGRAM_BOT_TOKEN,
    corsOrigin: process.env.CORS_ORIGIN,
    env: process.env.NODE_ENV
  });
});

// Отладочный endpoint для проверки Telegram
app.post('/api/test-telegram', async (req, res) => {
  try {
    const testMessage = `
✅ ТЕСТОВОЕ СООБЩЕНИЕ
Тестовая отправка из бэкенда работает!
Время: ${new Date().toLocaleString('ru-RU')}
    `;
    
    await sendTelegramMessage(testMessage);
    res.status(200).json({ success: true, message: 'Тестовое сообщение отправлено' });
  } catch (error) {
    console.error('❌ Ошибка тестовой отправки:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Отправка сообщения в Telegram (улучшенная версия)
async function sendTelegramMessage(text) {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    console.error('❌ Отсутствуют переменные окружения для Telegram');
    throw new Error('Не настроены параметры Telegram бота');
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN.trim(); // Убираем пробелы
  const chatId = process.env.TELEGRAM_CHAT_ID.trim(); // Убираем пробелы
  
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  
  const payload = {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML',
    disable_web_page_preview: true
  };

  console.log('📤 Отправка в Telegram:', { url, chatId });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const responseData = await response.json();
    console.log('📨 Ответ Telegram API:', responseData);

    if (!response.ok || !responseData.ok) {
      console.error('❌ Ошибка Telegram API:', responseData);
      throw new Error(`Telegram API error: ${responseData.description || 'Unknown error'}`);
    }

    console.log('✅ Успешно отправлено в Telegram');
    return responseData;
  } catch (error) {
    console.error('🔥 Критическая ошибка при отправке в Telegram:', {
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
}

// API endpoint для заказов (улучшенная версия)
app.post('/api/order', async (req, res) => {
  try {
    console.log('📦 Получен заказ:', JSON.stringify(req.body, null, 2));
    
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
    const crypto = require('crypto');
    const orderId = `ORD-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${Date.now().toString().slice(-4)}`;
    
    // Формирование сообщения для Telegram
    const itemsList = items.map(item => 
      `📦 ${item.name}\n💰 ${item.price.toLocaleString('ru-RU')} ₽`
    ).join('\n\n');

    const message = `
🛒 НОВЫЙ ЗАКАЗ #${orderId}

📋 ТОВАРЫ:
${itemsList}

💰 ИТОГО: ${total.toLocaleString('ru-RU')} ₽

👤 КЛИЕНТ:
👤 Имя: ${customer.name}
📱 Телефон: ${customer.phone}
💬 Комментарий: ${customer.comment || 'Не указан'}

⏰ Дата заказа: ${new Date(date || new Date()).toLocaleString('ru-RU', {
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
    
    console.log('📋 Форматированное сообщение:', message);
    
    // Отправка в Telegram
    const telegramResult = await sendTelegramMessage(message);
    
    console.log('✅ Заказ успешно обработан');
    
    // Отправка ответа клиенту
    res.status(200).json({
      success: true,
      message: 'Заказ успешно отправлен! Менеджер свяжется с вами в ближайшее время.',
      orderId: orderId,
      telegramMessageId: telegramResult?.result?.message_id
    });
    
  } catch (error) {
    console.error('❌ Ошибка при обработке заказа:', error);
    
    // Отправка ошибки клиенту
    res.status(500).json({ 
      error: error.message || 'Внутренняя ошибка сервера',
      success: false,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    
    // Отправка уведомления об ошибке в Telegram (если возможно)
    try {
      if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
        const errorData = req.body || {};
        await sendTelegramMessage(`
🚨 КРИТИЧЕСКАЯ ОШИБКА В СИСТЕМЕ ЗАКАЗОВ

❌ Ошибка: ${error.message}
🕐 Время: ${new Date().toLocaleString('ru-RU')}
📦 Данные заказа: ${JSON.stringify(errorData, null, 2).slice(0, 500)}
💻 Стек: ${error.stack?.slice(0, 200) || 'Нет данных'}

Пожалуйста, проверьте логи сервера!
        `);
      }
    } catch (telegramError) {
      console.error('❌ Не удалось отправить уведомление об ошибке в Telegram:', telegramError);
    }
  }
});

// Обработка 404
app.use((req, res) => {
  console.log('🔍 Запрос к несуществующему эндпоинту:', req.method, req.url);
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

// Запуск сервера с отладочной информацией
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`🌐 URL: http://0.0.0.0:${PORT}`);
  console.log(`✅ CORS origin: ${process.env.CORS_ORIGIN || 'https://alfat81.github.io'}`);
  console.log(`🔧 Node.js version: ${process.version}`);
  console.log(`🔑 Telegram бот настроен: ${!!process.env.TELEGRAM_BOT_TOKEN}`);
  console.log(`📞 Telegram chat ID: ${process.env.TELEGRAM_CHAT_ID?.slice(0, 4)}...${process.env.TELEGRAM_CHAT_ID?.slice(-4)}`);
  
  // Тестовое сообщение при запуске
  if (process.env.NODE_ENV === 'production' && process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    const startupMessage = `
✅ СИСТЕМА УСПЕШНО ЗАПУЩЕНА

🕐 Время запуска: ${new Date().toLocaleString('ru-RU')}
⚙️ Версия: 1.1.0
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
