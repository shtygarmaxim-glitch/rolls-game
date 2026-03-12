const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

let gameRoom = {
    players: [],
    timer: null,
    status: 'waiting' // 'waiting', 'counting', 'spinning'
};

io.on('connection', (socket) => {
    socket.emit('updateRoom', gameRoom);

    socket.on('joinGame', (userData) => {
        if (gameRoom.status === 'spinning') return;

        // Добавляем или обновляем ставку игрока
        const existingPlayer = gameRoom.players.find(p => p.id === socket.id);
        if (existingPlayer) {
            existingPlayer.amount += userData.amount;
        } else {
            gameRoom.players.push({
                id: socket.id,
                name: userData.userName,
                amount: userData.amount,
                color: `#${Math.floor(Math.random()*16777215).toString(16)}`
            });
        }

        // Если игроков двое и более — запускаем таймер
        if (gameRoom.players.length >= 2 && gameRoom.status === 'waiting') {
            startCountdown();
        }

        io.emit('updateRoom', gameRoom);
    });

    function startCountdown() {
        gameRoom.status = 'counting';
        let timeLeft = 20;
        
        gameRoom.timer = setInterval(() => {
            timeLeft--;
            io.emit('timerTick', timeLeft);

            if (timeLeft <= 0) {
                clearInterval(gameRoom.timer);
                finishGame();
            }
        }, 1000);
    }

    function finishGame() {
        gameRoom.status = 'spinning';
        const totalBank = gameRoom.players.reduce((sum, p) => sum + p.amount, 0);
        
        // Выбираем победителя по весам ставок
        let random = Math.random() * totalBank;
        let currentSum = 0;
        let winner = gameRoom.players[0];

        for (let p of gameRoom.players) {
            currentSum += p.amount;
            if (random <= currentSum) {
                winner = p;
                break;
            }
        }

        io.emit('startGameAnimation', { 
            winner: winner.name, 
            winnerId: winner.id,
            players: gameRoom.players, 
            totalBank: totalBank 
        });

        // Сброс игры через 8 секунд после начала крутки
        setTimeout(() => {
            gameRoom = { players: [], timer: null, status: 'waiting' };
            io.emit('updateRoom', gameRoom);
        }, 10000);
    }

    socket.on('disconnect', () => {
        // Если игрок вышел до начала отсчета, можно удалять, 
        // но в азартных играх лучше оставлять ставку в банке.
    });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log('Multiplayer Server Live!'));
