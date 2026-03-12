const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
// Порт 10000 для Render
const PORT = process.env.PORT || 10000;
const BOT_TOKEN = process.env.BOT_TOKEN; 

app.use(express.json());

// Раздаем статику прямо из корня (где лежит index.html)
app.use(express.static(__dirname));

// ===== ЭНДПОИНТЫ =====

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Путь для Mini App
app.get('/rolls', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API для результатов
app.post('/api/game-result', (req, res) => {
    const { userId, gameType, result } = req.body;
    console.log(`Новый результат от ${userId}:`, result);
    res.json({ success: true, message: 'Результат сохранен' });
});

// Обработка сообщений от Telegram
app.post(`/webhook/${BOT_TOKEN}`, (req, res) => {
    const msg = req.body.message;
    if (!msg || !msg.text) {
        res.sendStatus(200);
        return;
    }

    const chatId = msg.chat.id;
    if (msg.text === '/start') {
        sendMessage(chatId, 
            '🎡 Добро пожаловать в Rolls!\n\n' +
            'Нажмите кнопку ниже, чтобы запустить игру.'
        );
    }
    res.sendStatus(200);
});

// ===== ФУНКЦИИ =====

async function sendMessage(chatId, text) {
    if (!BOT_TOKEN) {
        console.error('ОШИБКА: BOT_TOKEN не задан в настройках Render!');
        return;
    }

    try {
        await axios.post(
            `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
            {
                chat_id: chatId,
                text: text,
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[
                        {
                            text: '🎮 Открыть игру',
                            web_app: {
                                // Render сам подставит домен в переменную RENDER_EXTERNAL_HOSTNAME
                                url: `https://${process.env.RENDER_EXTERNAL_HOSTNAME || 'your-app-name.onrender.com'}/rolls`
                            }
                        }
                    ]]
                }
            }
        );
    } catch (error) {
        console.error('Ошибка отправки в TG:', error.message);
    }
}

app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
    if (!BOT_TOKEN) {
        console.warn('ПРЕДУПРЕЖДЕНИЕ: BOT_TOKEN не найден в Environment Variables!');
    }
});
