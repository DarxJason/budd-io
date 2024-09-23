const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static('public')); // Serve static Phaser files

let players = {};

// Handle new connections
io.on('connection', (socket) => {
    console.log('New player connected:', socket.id);
    
    // Create a new player object
    players[socket.id] = {
        id: socket.id,
        x: Math.floor(Math.random() * 800), // Random X position
        y: Math.floor(Math.random() * 600), // Random Y position
        attacking: false // Initial attacking state
    };

    // Send the list of current players to the new player
    socket.emit('currentPlayers', players);
    
    // Notify all other players about the new player
    socket.broadcast.emit('newPlayer', players[socket.id]);

    // Handle player updates
    socket.on('playerUpdate', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            players[socket.id].attacking = data.attacking; // Update attacking state
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id); // Notify others
    });
});

// Emit player data to all clients at 60 FPS
setInterval(() => {
    io.emit('updatePlayers', players); // Broadcast the current players data to all clients
}, 1000 / 60); // 60 times a second

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
