const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
// Render зазвичай використовує порт 10000
const PORT = process.env.PORT || 10000;
const BOT_TOKEN = process.env.BOT_TOKEN; 

app.use(express.json());

// Раздаємо статичні файли (index.html тощо) прямо з кореневої папки
app.use(express.static(__dirname));

// ===== ENDPOINTS =====

// Головна сторінка
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Mini App шлях
app.get('/rolls', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API для збереження результатів
app.post('/api/game-result', (req, res) => {
    const { userId, gameType, result } = req.body;
    console.log(`Новий результат від ${userId}:`, result);
    res.json({ success: true, message: 'Результат збережено' });
});

// Обробка повідомлень від Telegram (Webhook)
app.post(`/webhook/${BOT_TOKEN}`, (req, res) => {
    const msg = req.body.message;

    if (!msg || !msg.text) {
        res.sendStatus(200);
        return;
    }

    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === '/start') {
        sendMessage(chatId, 
            '🎡 Ласкаво просимо до Rolls!\n\n' +
            'Натисніть кнопку нижче, щоб запустити гру.'
        );
    }

    res.sendStatus(200);
});

// ===== ДОПОМІЖНІ ФУНКЦІЇ =====

async function sendMessage(chatId, text) {
    if (!BOT_TOKEN) {
        console.error('Помилка: BOT_TOKEN не встановлено в Environment Variables на Render!');
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
                            text: '🎮 Відкрити гру',
                            web_app: {
                                // Замініть на ваше посилання від Render після успішного деплою
                                url: `https://${process.env.RENDER_EXTERNAL_HOSTNAME || 'your-app-name.onrender.com'}/rolls`
                            }
                        }
                    ]]
                }
            }
        );
    } catch (error) {
        console.error('Помилка відправки повідомлення в TG:', error.message);
    }
}

app.listen(PORT, () => {
    console.log(`Сервер запущено на порту ${PORT}`);
    if (!BOT_TOKEN) {
        console.warn('УВАГА: BOT_TOKEN не знайдено! Додайте його в налаштуваннях Render (Environment).');
    }
});