const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(__dirname));

let game = {
    players: [],
    status: 'waiting', 
    timeLeft: 10
};

io.on('connection', (socket) => {
    socket.emit('init', game);

    socket.on('bet', (data) => {
        if (game.status === 'racing') return;
        
        game.players.push({
            id: socket.id,
            name: data.name,
            color: data.color,
            balls: data.amount 
        });

        if (game.players.length >= 2 && game.status === 'waiting') {
            startTimer();
        }
        io.emit('updatePlayers', game.players);
    });

    function startTimer() {
        game.status = 'counting';
        game.timeLeft = 10;
        let timer = setInterval(() => {
            game.timeLeft--;
            io.emit('timer', game.timeLeft);
            if (game.timeLeft <= 0) {
                clearInterval(timer);
                game.status = 'racing';
                io.emit('startRace');
                setTimeout(resetGame, 25000);
            }
        }, 1000);
    }

    function resetGame() {
        game = { players: [], status: 'waiting', timeLeft: 10 };
        io.emit('init', game);
    }

    socket.on('winner', (data) => {
        io.emit('announceWinner', data);
    });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log('Physics Server Live on rolls-game'));
