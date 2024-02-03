// script.js
document.addEventListener("DOMContentLoaded", () => {
    // Make sure the port matches your Node.js server port
    // Use a variable for the server URL for easy configuration and to ensure secure connections in production
    const serverUrl = 'http://localhost:3333'; // TODO: Change this to use environment configuration or a more secure protocol (wss://) in production
    const socket = io(serverUrl);
    const form = document.getElementById('form');
    const input = document.getElementById('input');
    const messages = document.getElementById('messages');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const messageText = input.value.trim();
        if (messageText) {
            // More robust input validation can be added here if necessary
            socket.emit('sendMessage', messageText);
            input.value = '';
        }
    });

    socket.on('messageReceived', (message) => {
        if (message.status === 'error') {
            console.error('Error received:', message.error);
            // Handle the error, e.g., display an error message to the user
        } else {
            const item = document.createElement('li');
            item.textContent = message.message;
            messages.appendChild(item);
            window.scrollTo(0, document.body.scrollHeight);
        }
    });
});
