<?php
require_once __DIR__ . '/../vendor/autoload.php';

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

// Use environment variables for the database connection
$connectionString = $_ENV['DB_CONNECTION_STRING'];
$dbName = $_ENV['DB_NAME'];


// Allow requests from different origins (CORS)
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

// Connect to MongoDB and select the database
// Note: Use proper authentication and error handling in a real-world application
/** @var MongoDB\Client $mongo */
$mongo = new MongoDB\Client($connectionString);
$db = $mongo->selectDatabase($dbName);

// Get the posted data
$postData = file_get_contents('php://input');
$data = json_decode($postData, true);

$message = $data['message'] ?? '';

// Process the message (for example, store it in the database)
$collection = $db->selectCollection('messages');
$result = $collection->insertOne(['message' => $message]);

// Prepare the response
$response = [
    'status' => 'success',
    'message' => 'Message processed and stored in database.'
];

// Send the response back
echo json_encode($response);
