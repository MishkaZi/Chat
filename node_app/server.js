// Import required modules
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const routes = require('./routes');
const axios = require('axios');


// Initialize the express app and http server
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server);

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use(routes);

// Socket.IO connection
io.on('connection', (socket) => {
    console.log('New client connected');

    // Handle messages from client
    socket.on('sendMessage', (message) => {
        console.log('Message received:', message);

        // Here we will later emit an event to send the message to the PHP server for processing

        // Temporary response back to the client
        socket.emit('messageReceived', {
            status: 'success',
            message: 'Message received and processed.'
        });
    });

    socket.on('sendMessage', (message) => {
        console.log('Message received:', message);

        // Send the message to the PHP backend for processing
        axios.post('http://localhost/php_app/api/processMessage.php', {
            message: message
        })
            .then(response => {
                // Receive the response from PHP and send it back to the client
                console.log('Message processed by PHP:', response.data);
                socket.emit('messageReceived', response.data);
            })
            .catch(error => {
                console.error('Error processing message:', error);
                socket.emit('messageReceived', {
                    status: 'error',
                    message: 'Failed to process message.'
                });
            });
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});



// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = io; // Exporting for use in routes if needed
