const express = require('express');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);

app.use(express.static(__dirname));

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log('Solo Marble Server Live on rolls-game'));
