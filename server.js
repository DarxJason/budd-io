const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

// Create a new express app and server
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Serve the static files (like the Phaser game)
app.use(express.static('public'));

// Store all players connected to the server
let players = {};

// Handle player connections
io.on('connection', (socket) => {
    console.log('A player connected:', socket.id);

    // Add the new player to the players object
    players[socket.id] = {
        id: socket.id,
        x: Math.floor(Math.random() * 800), // Random spawn x
        y: Math.floor(Math.random() * 600), // Random spawn y
    };

    // Send the current players to the new player
    socket.emit('currentPlayers', players);

    // Notify existing players about the new player
    socket.broadcast.emit('newPlayer', players[socket.id]);

    // Handle player movement
    socket.on('playerMovement', (movementData) => {
        if (players[socket.id]) {
            players[socket.id].x = movementData.x;
            players[socket.id].y = movementData.y;

            // Broadcast the movement to all players
            socket.broadcast.emit('playerMoved', players[socket.id]);
        }
    });

    // Handle player disconnect
    socket.on('disconnect', () => {
        console.log('A player disconnected:', socket.id);
        delete players[socket.id];

        // Notify other players that this player has left
        io.emit('playerDisconnected', socket.id);
    });
});

// Start the server
server.listen(3000, () => {
    console.log('Server is running on port 3000');
});