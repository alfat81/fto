require('dotenv').config();
const express = require('express');
const cors = require('cors');

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

// Отправка сообщения в Telegram
async function sendTelegramMessage(text) {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    console.error('❌ Отсутствуют переменные окружения для Telegram');
    throw new Error('Не настроены параметры Telegram бота');
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID.trim();
  
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
      throw new Error(`Telegram API error: ${errorData.description || 'Unknown error'}`);
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}

// API endpoint для заказов
app.post('/api/order', async (req, res) => {
  try {
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
    
    // Формирование сообщения для Telegram
    const itemsList = items.map(item => 
      `📦 ${item.name}\n💰 ${item.price.toLocaleString('ru-RU')} ₽`
    ).join('\n\n');

    const message = `
🛒 НОВЫЙ ЗАКАЗ

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
    `.trim();
    
    // Отправка в Telegram
    await sendTelegramMessage(message);
    
    // Отправка ответа клиенту
    res.status(200).json({
      success: true,
      message: 'Заказ успешно отправлен! Менеджер свяжется с вами в ближайшее время.'
    });
    
  } catch (error) {
    console.error('❌ Ошибка при обработке заказа:', error);
    res.status(500).json({ 
      error: 'Ошибка при обработке заказа. Пожалуйста, попробуйте позже.',
      success: false
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Backend Фабрики торгового оборудования',
    api: {
      order: 'POST /api/order',
      health: 'GET /health'
    }
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

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`✅ CORS origin: ${process.env.CORS_ORIGIN || 'https://alfat81.github.io'}`);
});

module.exports = app;
