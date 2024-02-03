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

// Ensure the script only processes POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}

try {
    // Connect to MongoDB and select the database
    // Note: Use proper authentication and error handling in a real-world application
    $mongo = new MongoDB\Client($connectionString);
    $db = $mongo->selectDatabase($dbName);

    // Get the posted data
    $postData = file_get_contents('php://input');
    $data = json_decode($postData, true);

    $messageId = $data['id'] ?? '';
    $newContent = $data['newContent'] ?? '';

    // Validate input
    if (empty($messageId) || empty($newContent)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Invalid input']);
        exit;
    }
    
    // Update the message
    $result = $collection->updateOne(
        ['_id' => new MongoDB\BSON\ObjectId($messageId)],
        ['$set' => ['message' => $newContent]]
    );

    // Prepare the response
    $response = [
        'status' => 'success',
        'message' => 'Message updated successfully.'
    ];
    
} catch (\Throwable $e) {
    // Error handling
    http_response_code(500);
    $response = [
        'status' => 'error',
        'message' => 'Failed to update message',
        'error' => $e->getMessage()
    ];
}

echo json_encode($response);