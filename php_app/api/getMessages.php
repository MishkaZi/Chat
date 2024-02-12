<?php
require_once __DIR__ . '/../vendor/autoload.php';

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

// Use environment variables for the database connection
$connectionString = $_ENV['DB_CONNECTION_STRING'];
$dbName = $_ENV['DB_NAME'];

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

// Ensure the script only processes GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}

try {
    // Connect to MongoDB and select the database
    // Note: Use proper authentication and error handling in a real-world application
    $mongo = new MongoDB\Client($connectionString);
    $db = $mongo->selectDatabase($dbName);

    $collection = $db->selectCollection('messages');

    // Fetch all messages
    $messages = $collection->find()->toArray();

    // Prepare the response
    $response = [
        'status' => 'success',
        'messages' => $messages
    ];
} catch (\Throwable $e) {
    // Error handling
    http_response_code(500);
    $response = [
        'status' => 'error',
        'message' => 'Failed to fetch messages',
        'error' => $e->getMessage()
    ];
}

echo json_encode($response);
