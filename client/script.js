// script.js
document.addEventListener("DOMContentLoaded", () => {
    const serverUrl = 'http://localhost:3333';
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
        item.setAttribute('data-id', message._id);
        item.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start'); // Added classes

        const messageText = document.createElement('span');
        messageText.textContent = message.message;
        item.appendChild(messageText);

        // Create container for buttons (flexbox)
        const buttonContainer = document.createElement('div');
        buttonContainer.classList.add('d-flex'); // Flexbox container

        // Edit button
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.onclick = () => makeMessageEditable(message._id, messageText);
        editBtn.classList.add('btn', 'btn-sm', 'btn-warning', 'w-50', 'me-2'); // Added classes

        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = () => deleteMessage(message._id);
        deleteBtn.classList.add('btn', 'btn-sm', 'btn-danger', 'w-50'); // Added classes

        buttonContainer.appendChild(editBtn);
        buttonContainer.appendChild(deleteBtn);
        item.appendChild(buttonContainer); // Add buttons to container, then to list item

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

        }
    });
});
