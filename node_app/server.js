// Import required modules
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const routes = require('./routes');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require("express-rate-limit");

require('dotenv').config();

// Initialize the express app and http server
const app = express();
const server = http.createServer(app);

// Set up a white list and check against it:
var whitelist = process.env.CORS_WHITELIST.split(',');
var corsOptions = {
    origin: function (origin, callback) {
        if (whitelist.indexOf(origin) !== -1 || !origin) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    }
}

// Then pass them to cors:
app.use(cors(corsOptions));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

// Apply to all requests
app.use(limiter);

const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());

// Routes
app.use(routes);

// Socket.IO connection
io.on('connection', (socket) => {
    console.log('New client connected');
    // Fetch and emit all messages on new connection
    axios.get(`${process.env.PHP_SERVER_URL}/api/getMessages.php`)
        .then(response => {
            if (response.data.status === 'success') {
                socket.emit('allMessages', response.data.messages);
            } else {
                console.error('Failed to fetch messages');
            }
        })
        .catch(error => console.error('Error fetching messages:', error));

    // Handle edit message
    socket.on('editMessage', (data) => {
        axios.post(`${process.env.PHP_SERVER_URL}/api/editMessage.php`, data)
            .then(response => {
                if (response.data.status === 'success') {
                    // Inform all clients about the message update
                    io.emit('messageUpdated', { id: data.id, newContent: data.newContent });
                } else {
                    console.error('Failed to edit message');
                }
            })
            .catch(error => console.error('Error editing message:', error));
    });

    // Handle delete message
    socket.on('deleteMessage', (data) => {
        axios.post(`${process.env.PHP_SERVER_URL}/api/deleteMessage.php`, data)
            .then(response => {
                if (response.data.status === 'success') {
                    // Inform all clients that the message was deleted
                    io.emit('messageDeleted', { id: data.id });
                } else {
                    console.error('Failed to delete message');
                }
            })
            .catch(error => console.error('Error deleting message:', error));
    });

    // Handle messages from client
    socket.on('sendMessage', (messageText) => {
        console.log('Message received:', messageText);
        // Assuming validation passed and message was sent to PHP and saved successfully
        axios.post(`${process.env.PHP_SERVER_URL}/api/processMessage.php`, {
            message: messageText
        })
        .then(response => {
            if (response.data.status === 'success') {
                // Broadcast the new message to all clients, including the sender
                io.emit('messageReceived', response.data.message);
            } else {
                // Handle error scenario
                console.error('PHP processing error:', response.data.message);
                socket.emit('messageReceived', {
                    status: 'error',
                    message: 'Failed to process message.'
                });
            }
        })
        .catch(error => {
            console.error('Request error:', error);
            socket.emit('messageReceived', {
                status: 'error',
                message: 'Failed to send message to PHP.'
            });
        });
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({
        status: 'error',
        message: err.message || 'Internal Server Error',
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = io; // Exporting for use in routes if needed
