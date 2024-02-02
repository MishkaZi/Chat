const express = require('express');
const router = express.Router();

// Define routes here
router.get('/', (req, res) => {
    res.send('Welcome to the Chat Node.js server!');
});

// Export the router
module.exports = router;
