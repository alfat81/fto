/**
 * FTO Backend v2.0 — отправка форм с сайта на email.
 *
 * ЗАЧЕМ НУЖЕН:
 *   Раньше на сайте использовался Telegram-бот для приёма заявок.
 *   Поскольку Telegram заблокирован в России, мы перешли на email.
 *
 *   Front-end вызывает POST /api/send → backend использует nodemailer
 *   и SMTP Mail.ru для отправки письма на alfat@list.ru (для тестов)
 *   или другой адрес, указанный в EMAIL_TO.
 *
 * SMTP:
 *   Mail.ru: smtp.mail.ru:465 (SSL) или :587 (STARTTLS)
 *   Для авторизации нужен "пароль приложения" (не основной пароль от ящика).
 *   Инструкция: https://help.mail.ru/mail/security/protection/external
 *
 * ENDPOINTS:
 *   GET  /            → health check (JSON)
 *   GET  /api/health  → health check (JSON)
 *   POST /api/send    → { subject, text } → отправляет email, возвращает { ok: true }
 *
 * ENV:
 *   SMTP_HOST     — SMTP сервер (по умолчанию smtp.mail.ru)
 *   SMTP_PORT     — порт (по умолчанию 465)
 *   SMTP_USER     — логин (email отправителя, например alfat@list.ru)
 *   SMTP_PASS     — пароль приложения Mail.ru
 *   EMAIL_FROM    — имя отправителя (по умолчанию "Сайт ФТО")
 *   EMAIL_TO      — куда отправлять (по умолчанию alfat@list.ru)
 *   CORS_ORIGIN   — разрешённый origin (https://alfat81.github.io)
 *   PORT          — порт сервера
 */

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// ━━ Конфигурация SMTP ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.mail.ru';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465', 10);
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const EMAIL_FROM = process.env.EMAIL_FROM || 'Сайт ФТО';
const EMAIL_TO   = process.env.EMAIL_TO || 'alfat@list.ru';
const CORS_OR    = process.env.CORS_ORIGIN || '*';

if (!SMTP_USER || !SMTP_PASS) {
    console.error('⚠️  SMTP_USER и SMTP_PASS должны быть установлены в environment.');
    console.error('    Без них /api/send будет возвращать HTTP 503.');
    console.error('    Создайте .env файл (см. .env.example).');
    console.error('    Для Mail.ru нужен "пароль приложения" — не основной пароль.');
    console.error('    Инструкция: https://help.mail.ru/mail/security/protection/external');
}

// ━━ Создаём transporter (переиспользуемое соединение) ━━━━━━━━
let transporter = null;
function getTransporter() {
    if (transporter) return transporter;
    transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465, // true для 465, false для 587
        auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    });
    return transporter;
}

// ━━ Middleware ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
app.use(express.json({ limit: '64kb' }));
app.use(cors({
    origin: CORS_OR === '*' ? true : CORS_OR.split(',').map(s => s.trim()),
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
}));

// Rate limiting: 5 запросов в минуту на IP (защита от спама)
const sendLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, error: 'слишком много запросов, попробуйте позже' },
});
app.use('/api/send', sendLimiter);

// ━━ Health check ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
app.get('/', (req, res) => {
    res.json({
        name: 'FTO backend',
        version: '2.0.0',
        status: 'ok',
        smtp_configured: Boolean(SMTP_USER && SMTP_PASS),
        email_to: EMAIL_TO,
        time: new Date().toISOString(),
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        ok: true,
        smtp_configured: Boolean(SMTP_USER && SMTP_PASS),
        email_to: EMAIL_TO,
    });
});

// ━━ POST /api/send — отправка email ━━━━━━━━━━━━━━━━━━━━━━━━━
app.post('/api/send', async (req, res) => {
    const { subject, text } = req.body || {};

    if (!text || typeof text !== 'string') {
        return res.status(400).json({ ok: false, error: 'отсутствует текст сообщения' });
    }
    if (text.length > 10000) {
        return res.status(400).json({ ok: false, error: 'сообщение слишком длинное' });
    }

    if (!SMTP_USER || !SMTP_PASS) {
        console.error('[/api/send] SMTP не настроен (SMTP_USER/SMTP_PASS пустые)');
        return res.status(503).json({ ok: false, error: 'сервис временно недоступен' });
    }

    const finalSubject = subject || 'Сообщение с сайта ФТО';

    try {
        const t = getTransporter();
        const info = await t.sendMail({
            from: `"${EMAIL_FROM}" <${SMTP_USER}>`,
            to: EMAIL_TO,
            subject: finalSubject,
            text: text,
            // HTML-версия с простой разметкой
            html: `<pre style="font-family: -apple-system, sans-serif; font-size: 14px; line-height: 1.6; white-space: pre-wrap; color: #0f172a;">${escapeHtml(text)}</pre>`,
        });

        console.log(`[/api/send] ✓ email sent: "${finalSubject}" → ${EMAIL_TO} (messageId: ${info.messageId})`);
        return res.json({ ok: true, messageId: info.messageId });
    } catch (err) {
        console.error('[/api/send] SMTP error:', err.message);
        return res.status(502).json({
            ok: false,
            error: 'ошибка отправки email (проверьте SMTP-настройки)'
        });
    }
});

function escapeHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// ━━ 404 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
app.use((req, res) => {
    res.status(404).json({ ok: false, error: 'не найдено' });
});

// ━━ Start ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
app.listen(PORT, () => {
    console.log(`✓ FTO backend v2.0 listening on port ${PORT}`);
    console.log(`  SMTP: ${SMTP_HOST}:${SMTP_PORT} (user: ${SMTP_USER || 'NOT SET'})`);
    console.log(`  Email to: ${EMAIL_TO}`);
    console.log(`  CORS origin: ${CORS_OR}`);
    console.log(`  SMTP configured: ${SMTP_USER && SMTP_PASS ? 'YES' : 'NO'}`);
});
