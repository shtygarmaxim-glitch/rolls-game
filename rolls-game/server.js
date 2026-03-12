const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

let lobbyGames = [];

io.on('connection', (socket) => {
    console.log('Игрок подключился:', socket.id);

    // Отправляем текущее лобби новому игроку
    socket.emit('updateLobby', lobbyGames);

    // Создание ставки
    socket.on('createBet', (data) => {
        const newGame = { 
            id: socket.id, 
            amount: data.amount, 
            userName: data.userName 
        };
        // Удаляем старые ставки этого же игрока, чтобы не спамил
        lobbyGames = lobbyGames.filter(g => g.id !== socket.id);
        lobbyGames.push(newGame);
        io.emit('updateLobby', lobbyGames);
    });

    // Когда второй игрок принимает вызов
    socket.on('joinGame', (data) => {
        const game = lobbyGames.find(g => g.id === data.gameId);
        if (game) {
            // Убираем игру из списка доступных
            lobbyGames = lobbyGames.filter(g => g.id !== data.gameId);
            io.emit('updateLobby', lobbyGames);
            
            // Магия: определяем победителя на сервере (50/50)
            const winnerName = Math.random() > 0.5 ? game.userName : data.participantName;
            
            // Даем команду обоим игрокам запустить анимацию
            io.emit('startGameAnimation', { 
                winner: winnerName,
                amount: game.amount 
            });
        }
    });

    socket.on('disconnect', () => {
        lobbyGames = lobbyGames.filter(g => g.id !== socket.id);
        io.emit('updateLobby', lobbyGames);
    });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log('Сервер онлайн!'));
