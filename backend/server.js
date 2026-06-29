/**
 * FTO Backend — secure proxy for sending messages to Telegram.
 *
 * Why this exists:
 *   In Phase 1 of the audit we removed the Telegram bot token from the front-end
 *   (it was previously sitting in plain text in docs/js/config.js, which is a
 *   critical security issue — any visitor could read it and send arbitrary
 *   messages on behalf of the bot).
 *
 *   Now the token lives ONLY in the server environment (.env / Render env vars),
 *   and the front-end calls POST /api/send which proxies to Telegram Bot API.
 *
 * Endpoints:
 *   GET  /           → health check
 *   GET  /api/health → health check (JSON)
 *   POST /api/send   → { text: "..." } → forwards to Telegram, returns { ok: true }
 *
 * Env vars required:
 *   TELEGRAM_BOT_TOKEN  — bot token from @BotFather
 *   TELEGRAM_CHAT_ID    — chat ID where messages will be sent
 *   CORS_ORIGIN         — allowed origin (e.g. https://alfat81.github.io)
 *   PORT                — server port (Render sets this automatically)
 */

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// ━━ Validate env vars on startup ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TG_CHAT  = process.env.TELEGRAM_CHAT_ID;
const CORS_OR  = process.env.CORS_ORIGIN || '*';

if (!TG_TOKEN || !TG_CHAT) {
    console.error('⚠️  TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be set in environment.');
    console.error('    Without them, /api/send will return HTTP 503 (service unavailable).');
    console.error('    Create .env file (see .env.example) or set env vars on Render.');
}

// ━━ Middleware ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
app.use(express.json({ limit: '32kb' }));  // messages are short
app.use(cors({
    origin: CORS_OR === '*' ? true : CORS_OR.split(',').map(s => s.trim()),
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
}));

// Rate limiting: 5 requests per minute per IP (protects against spam)
const sendLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, error: 'слишком много запросов, попробуйте позже' },
});
app.use('/api/send', sendLimiter);

// ━━ Health check ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
app.get('/', (req, res) => {
    res.json({
        name: 'FTO backend',
        status: 'ok',
        telegram_configured: Boolean(TG_TOKEN && TG_CHAT),
        time: new Date().toISOString(),
    });
});

app.get('/api/health', (req, res) => {
    res.json({ ok: true, telegram_configured: Boolean(TG_TOKEN && TG_CHAT) });
});

// ━━ Send endpoint ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
app.post('/api/send', async (req, res) => {
    const { text } = req.body || {};

    if (!text || typeof text !== 'string') {
        return res.status(400).json({ ok: false, error: 'отсутствует текст сообщения' });
    }
    if (text.length > 4000) {
        return res.status(400).json({ ok: false, error: 'сообщение слишком длинное' });
    }

    // If backend not configured — fail honestly
    if (!TG_TOKEN || !TG_CHAT) {
        console.error('[/api/send] Telegram env vars not configured');
        return res.status(503).json({ ok: false, error: 'сервис временно недоступен' });
    }

    try {
        const tgResp = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TG_CHAT,
                text,
                parse_mode: 'HTML',
                disable_web_page_preview: true,
            }),
        });

        const tgData = await tgResp.json();
        if (!tgResp.ok || !tgData.ok) {
            console.error('[/api/send] Telegram API error:', tgData);
            return res.status(502).json({ ok: false, error: 'ошибка отправки в Telegram' });
        }

        console.log(`[/api/send] ✓ message sent (${text.length} chars)`);
        return res.json({ ok: true });
    } catch (err) {
        console.error('[/api/send] Network error:', err.message);
        return res.status(500).json({ ok: false, error: 'внутренняя ошибка сервера' });
    }
});

// ━━ 404 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
app.use((req, res) => {
    res.status(404).json({ ok: false, error: 'не найдено' });
});

// ━━ Start ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
app.listen(PORT, () => {
    console.log(`✓ FTO backend listening on port ${PORT}`);
    console.log(`  CORS origin: ${CORS_OR}`);
    console.log(`  Telegram: ${TG_TOKEN ? 'configured' : 'NOT configured (set TELEGRAM_BOT_TOKEN)'}`);
});
