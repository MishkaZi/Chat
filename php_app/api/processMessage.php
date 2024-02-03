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

    $message = $data['message'] ?? '';

    // Validate the message
    if (empty($message)) {
        http_response_code(400); // Bad Request
        echo json_encode(['status' => 'error', 'message' => 'No message provided']);
        exit;
    }

    // Process the message (for example, store it in the database)
    $collection = $db->selectCollection('messages');
    $result = $collection->insertOne(['message' => $message]);

    // Prepare the response
    $response = [
        'status' => 'success',
        'message' => 'Message processed and stored in database.'
    ];
} catch (\Exception $e) {
    // Handle MongoDB specific exceptions (if recognized)
    http_response_code(500);
    $response = [
        'status' => 'error',
        'message' => 'MongoDB related error occurred',
        'error' => $e->getMessage()
    ];
} catch (\Throwable $e) {
    // Handle any other exceptions
    http_response_code(500);
    $response = [
        'status' => 'error',
        'message' => 'Internal Server Error',
        'error' => $e->getMessage() // Be cautious with exposing detailed error messages
    ];
}

// Send the response back
echo json_encode($response);
