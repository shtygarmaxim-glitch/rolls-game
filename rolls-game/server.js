const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

let players = {};
let currentBets = [];

io.on('connection', (socket) => {
    console.log('Игрок подключился:', socket.id);

    // Когда игрок заходит, он отправляет свои данные из TG
    socket.on('join', (userData) => {
        players[socket.id] = { ...userData, socketId: socket.id };
        io.emit('updatePlayers', Object.values(players));
    });

    // Создание ставки
    socket.on('createBet', (amount) => {
        const newBet = {
            id: Math.random().toString(36).substr(2, 9),
            creator: players[socket.id],
            amount: amount,
            status: 'waiting'
        };
        currentBets.push(newBet);
        io.emit('newBetCreated', currentBets);
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('updatePlayers', Object.values(players));
    });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`Server on port ${PORT}`));
