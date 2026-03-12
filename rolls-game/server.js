const express = require('express');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN; // Сохраните токен в .env

app.use(express.json());
app.use(express.static('public')); // Папка с HTML/CSS/JS

// ===== ENDPOINTS =====

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Mini App
app.get('/rolls', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API для сохранения результатов игры
app.post('/api/game-result', (req, res) => {
    const { userId, gameType, result } = req.body;

    console.log(`Новый результат от ${userId}:`, result);

    // Здесь можно сохранить в БД
    // await saveGameResult(userId, gameType, result);

    res.json({ success: true, message: 'Результат сохранен' });
});

// API для получения статистики
app.get('/api/stats/:userId', (req, res) => {
    const userId = req.params.userId;

    // Получить статистику из БД
    const stats = {
        userId: userId,
        wheelGames: 10,
        wheelWins: 6,
        ballsGames: 8,
        ballsFinishes: 5,
        ballsBestTime: 12.5,
    };

    res.json(stats);
});

// Webhook для сообщений от Telegram
app.post(`/webhook/${BOT_TOKEN}`, (req, res) => {
    const msg = req.body.message;

    if (!msg) {
        res.sendStatus(200);
        return;
    }

    const chatId = msg.chat.id;
    const text = msg.text;

    console.log(`Сообщение от ${chatId}: ${text}`);

    if (text === '/start') {
        sendMessage(chatId, 
            '🎡 Добро пожаловать в Rolls!\n\n' +
            'Нажмите кнопку ниже, чтобы запустить мини-приложение.'
        );
    }

    res.sendStatus(200);
});

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====

async function sendMessage(chatId, text) {
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
                            text: '🎮 Открыть приложение',
                            web_app: {
                                url: 'https://yourdomain.com/rolls'
                            }
                        }
                    ]]
                }
            }
        );
    } catch (error) {
        console.error('Ошибка при отправке сообщения:', error);
    }
}

// ===== ЗАПУСК СЕРВЕРА =====

app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
    console.log(`📱 Mini App доступен на http://localhost:${PORT}/rolls`);
});