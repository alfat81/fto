# Фабрика торгового оборудования — ФТО

Сайт фабрики торгового оборудования в Нижнем Новгороде.

## Контакты
- **Телефон:** +7 (960) 178-67-38
- **Email:** a20072005@yandex.ru
- **Адрес:** ул. Тургенева, 9, Нижний Новгород
- **Сайт:** https://alfat81.github.io/fto/

## Технологии
- **Фронтенд:** HTML5, CSS3, JavaScript (vanilla, без сборщика)
- **Бэкенд:** Node.js, Express (для проксирования Telegram-сообщений)
- **Хостинг фронтенда:** GitHub Pages (директория `/docs`)
- **Хостинг бэкенда:** Render.com

## Структура репозитория

```
fto/
├── docs/                  # Фронтенд (деплоится на GitHub Pages)
│   ├── index.html         # Главная
│   ├── catalog.html       # Каталог
│   ├── about.html         # О компании
│   ├── contacts.html      # Контакты + форма
│   ├── privacy.html       # Политика конфиденциальности (152-ФЗ)
│   ├── robots.txt
│   ├── sitemap.xml
│   ├── manifest.json
│   ├── css/               # 2 CSS-файла
│   ├── js/                # 7 JS-модулей
│   ├── data/products/     # 20 товаров + index.json
│   ├── images/            # Оптимизированные изображения
│   └── components/        # (удалено в Phase 1)
├── backend/               # Express-сервер для Telegram-прокси
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   └── README.md
└── render.yaml            # Конфиг деплоя бэкенда на Render.com
```

## Настройка

### Фронтенд (GitHub Pages)
1. Все файлы фронтенда находятся в папке `docs/`
2. В настройках GitHub Pages выберите:
   - Branch: `main`
   - Folder: `/docs`
3. Сайт будет доступен по адресу: `https://alfat81.github.io/fto/`

### Бэкенд (Render.com)
См. подробную инструкцию в [backend/README.md](backend/README.md).

После деплоя бэкенда укажите его URL в `docs/js/config.js`:
```js
backend: {
    url: 'https://fto-backend-xxxx.onrender.com'
}
```

## Лицензия
MIT License
