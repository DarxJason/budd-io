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
        y: Math.floor(Math.random() * 600)  // Random Y position
    };

    // Send the list of current players to the new player
    socket.emit('currentPlayers', players);
    
    // Notify all other players about the new player
    socket.broadcast.emit('newPlayer', players[socket.id]);

    // Handle player movement
    socket.on('playerMovement', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            io.emit('playerMoved', players[socket.id]); // Notify all players
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id); // Notify others
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
