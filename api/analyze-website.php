<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Get the input data
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['url'])) {
    http_response_code(400);
    echo json_encode(['error' => 'URL is required']);
    exit();
}

$url = $input['url'];
$domain = parse_url($url, PHP_URL_HOST);
$domain = preg_replace('/^www\./', '', $domain);
$brandName = ucfirst(explode('.', $domain)[0]);

// Mock data that matches the expected API format from GTM
$mockData = [
    'success' => true,
    'data' => [
        'url' => $url,
        'domain' => $domain,
        'screenshot' => [
            'url' => "https://via.placeholder.com/1920x1080/cccccc/000000?text={$brandName}",
            'width' => 1920,
            'height' => 1080
        ],
        'colors' => [
            ['hex' => '#1a73e8', 'frequency' => 0.25],
            ['hex' => '#ffffff', 'frequency' => 0.20],
            ['hex' => '#000000', 'frequency' => 0.15],
            ['hex' => '#f8f9fa', 'frequency' => 0.12],
            ['hex' => '#34a853', 'frequency' => 0.08]
        ],
        'logos' => [
            [
                'url' => "https://logo.clearbit.com/{$domain}",
                'type' => 'primary',
                'width' => 200,
                'height' => 80,
                'confidence' => 0.95
            ]
        ],
        'fonts' => [
            ['family' => 'Arial', 'weight' => 'normal', 'usage' => 'primary'],
            ['family' => 'Helvetica', 'weight' => 'bold', 'usage' => 'headings']
        ],
        'meta' => [
            'title' => "{$brandName} - Official Website",
            'description' => "Welcome to {$brandName}. Leading technology company focused on innovation.",
            'keywords' => "technology, innovation, {$brandName}"
        ],
        'social' => [
            'twitter' => "https://twitter.com/{$brandName}",
            'facebook' => "https://facebook.com/{$brandName}",
            'linkedin' => "https://linkedin.com/company/{$brandName}"
        ],
        'tracking' => [
            'googleAnalytics' => false,
            'googleTagManager' => false,
            'facebookPixel' => false
        ]
    ],
    'processing_time' => '2.5s',
    'timestamp' => date('c')
];

// Add small delay to simulate processing
usleep(500000); // 0.5 seconds

echo json_encode($mockData);
?>