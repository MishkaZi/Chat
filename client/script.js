// script.js
document.addEventListener("DOMContentLoaded", () => {
    const socket = io('http://localhost:3333'); // Make sure the port matches your Node.js server port
    const form = document.getElementById('form');
    const input = document.getElementById('input');
    const messages = document.getElementById('messages');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (input.value) {
            socket.emit('sendMessage', input.value);
            input.value = '';
        }
    });

    socket.on('messageReceived', (message) => {
        const item = document.createElement('li');
        item.textContent = message.message; // Adapt based on how your message data is structured
        messages.appendChild(item);
        window.scrollTo(0, document.body.scrollHeight);
    });
});
