// Import required modules
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const routes = require('./routes');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require("express-rate-limit");
const { body, validationResult } = require('express-validator');

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

    // Handle messages from client
    socket.on('sendMessage', (message) => {
        console.log('Message received:', message);

        // Validate the message
        const errors = validationResult(message);
        if (!errors.isEmpty()) {
            return socket.emit('messageReceived', {
                status: 'error',
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        // Send the message to the PHP backend for processing
        axios.post(`${process.env.PHP_SERVER_URL}/api/processMessage.php`, {
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
