const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static('public')); // Serve static files from the 'public' directory

let players = {};

// Handle new connections
io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // Create a new player object
    players[socket.id] = {
        id: socket.id,
        x: Math.floor(Math.random() * 800),
        y: Math.floor(Math.random() * 600),
        attacking: false
    };

    // Send the current players to the new player
    socket.emit('currentPlayers', players);

    // Notify other players about the new player
    socket.broadcast.emit('newPlayer', players[socket.id]);

    // Handle player movement updates
    socket.on('playerUpdate', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            players[socket.id].attacking = data.attacking;
        }
    });

    // Handle player disconnection
    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });
});

// Emit player updates to all clients at 60 FPS
setInterval(() => {
    io.emit('updatePlayers', players);
}, 1000 / 60);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
