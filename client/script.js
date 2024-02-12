// script.js
document.addEventListener("DOMContentLoaded", () => {
    // Make sure the port matches your Node.js server port
    // Use a variable for the server URL for easy configuration and to ensure secure connections in production
    const serverUrl = 'http://localhost:3333'; // TODO: Change this to use environment configuration or a more secure protocol (wss://) in production
    const socket = io(serverUrl);
    const form = document.getElementById('form');
    const input = document.getElementById('input');
    const messages = document.getElementById('messages');

    // Listen for all messages event
    socket.on('allMessages', (messages) => {
        messages.forEach(message => {
            addMessageToList(message);
        });
    });

    // Listen for message update
    socket.on('messageUpdated', (data) => {
        // Find the message item
        const messageElement = document.querySelector(`[data-id="${data.id}"] span`);
        if (messageElement) {
            messageElement.textContent = data.newContent;
        }
    });

    // Listen for message deletion
    socket.on('messageDeleted', (data) => {
        // Remove the message from the UI
        const messageElement = document.querySelector(`[data-id="${data.id}"]`);
        if (messageElement) {
            messageElement.remove();
        }
    });

    function addMessageToList(message) {
        
        const item = document.createElement('li');
        item.setAttribute('data-id', message._id); // Ensure each message has a data-id attribute for identification

        const messageText = document.createElement('span');
        messageText.textContent = message.message;
        item.appendChild(messageText);

        // Add Edit button
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.classList.add('edit-btn');
        editBtn.onclick = () => makeMessageEditable(message._id, messageText);
        item.appendChild(editBtn);

        // Add Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.classList.add('delete-btn');
        deleteBtn.onclick = () => deleteMessage(message._id);
        item.appendChild(deleteBtn);

        messages.appendChild(item);
    }

    // Make message editable
    function makeMessageEditable(messageId, messageElement) {
        const currentText = messageElement.textContent;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentText;
        input.classList.add('editable');
        messageElement.parentNode.replaceChild(input, messageElement);

        input.focus();
        input.select();

        // Save the edited message on blur
        input.onblur = () => saveEditedMessage(messageId, input);
    }

    // Save the edited message
    function saveEditedMessage(messageId, input) {
        const newText = input.value.trim();
        if (newText) {
            socket.emit('editMessage', { id: messageId, newContent: newText });
            const messageText = document.createElement('span');
            messageText.textContent = newText;
            input.parentNode.replaceChild(messageText, input);
        }
    }

    // Function to handle message delete
    function deleteMessage(messageId) {
        
        if (confirm("Are you sure you want to delete this message?")) {
            socket.emit('deleteMessage', { id: messageId });
        }
    }

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
            addMessageToList(message);
            const item = document.createElement('li');
            item.textContent = message.message;
            messages.appendChild(item);
            window.scrollTo(0, document.body.scrollHeight);
        }
    });
});
