const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" },
    transports: ['websocket', 'polling']
});

app.use(express.static(__dirname));

let gameRoom = {
    players: [],
    timer: null,
    status: 'waiting',
    timeLeft: 20
};

io.on('connection', (socket) => {
    console.log('Новое подключение:', socket.id);
    socket.emit('updateRoom', gameRoom);

    socket.on('joinGame', (userData) => {
        console.log('Попытка входа:', userData.userName, 'Ставка:', userData.amount);
        
        if (gameRoom.status === 'spinning') return;

        let player = gameRoom.players.find(p => p.id === socket.id);
        if (player) {
            player.amount += userData.amount;
        } else {
            gameRoom.players.push({
                id: socket.id,
                name: userData.userName,
                amount: userData.amount,
                color: '#' + Math.floor(Math.random()*16777215).toString(16)
            });
        }

        if (gameRoom.players.length >= 2 && gameRoom.status === 'waiting') {
            startCountdown();
        }

        io.emit('updateRoom', gameRoom);
    });

    function startCountdown() {
        gameRoom.status = 'counting';
        gameRoom.timeLeft = 20;
        console.log('Таймер запущен');
        
        if (gameRoom.timer) clearInterval(gameRoom.timer);
        
        gameRoom.timer = setInterval(() => {
            gameRoom.timeLeft--;
            io.emit('timerTick', gameRoom.timeLeft);

            if (gameRoom.timeLeft <= 0) {
                clearInterval(gameRoom.timer);
                finishGame();
            }
        }, 1000);
    }

    function finishGame() {
        if (gameRoom.players.length < 2) {
            gameRoom.status = 'waiting';
            io.emit('updateRoom', gameRoom);
            return;
        }

        gameRoom.status = 'spinning';
        const totalBank = gameRoom.players.reduce((sum, p) => sum + p.amount, 0);
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

        console.log('Победитель определен:', winner.name);
        io.emit('startGameAnimation', { 
            winner: winner.name, 
            winnerSocketId: winner.id,
            players: gameRoom.players, 
            totalBank: totalBank 
        });

        setTimeout(() => {
            gameRoom = { players: [], timer: null, status: 'waiting', timeLeft: 20 };
            io.emit('updateRoom', gameRoom);
        }, 12000);
    }

    socket.on('disconnect', () => {
        console.log('Игрок отключился:', socket.id);
    });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log('=== СЕРВЕР ЗАПУЩЕН НА ПОРТУ', PORT, '==='));
