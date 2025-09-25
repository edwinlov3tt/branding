<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

$company = $_GET['company'] ?? '';
$format = $_GET['format'] ?? 'json';

if (empty($company)) {
    http_response_code(400);
    echo json_encode(['error' => 'Company parameter is required']);
    exit();
}

// Clean company name
$cleanCompany = preg_replace('/^www\./', '', $company);
$companyName = ucfirst(explode('.', $cleanCompany)[0]);

// Mock research data - in production this would query a database or external APIs
$mockResearchData = [
    'success' => true,
    'cached' => true,
    'cache_age_days' => rand(1, 30),
    'report' => [
        'companyInfo' => [
            'name' => $companyName,
            'domain' => $cleanCompany,
            'industry' => 'Technology',
            'founded' => '2010',
            'employees' => '100-500',
            'location' => 'San Francisco, CA',
            'description' => "Leading technology company focused on innovation and digital solutions."
        ],
        'financials' => [
            'revenue' => '$10M-50M',
            'funding' => '$5M Series A',
            'investors' => ['Venture Capital Partners', 'Tech Accelerator Fund']
        ],
        'competitors' => [
            ['name' => 'Competitor A', 'similarity' => 85],
            ['name' => 'Competitor B', 'similarity' => 78],
            ['name' => 'Competitor C', 'similarity' => 72]
        ],
        'marketPosition' => [
            'segment' => 'Mid-market',
            'strengths' => ['Innovation', 'Customer Service', 'Technology'],
            'opportunities' => ['International Expansion', 'Product Diversification']
        ],
        'digitalPresence' => [
            'website_traffic' => 'Growing',
            'social_media' => 'Active',
            'content_strategy' => 'Blog + Social',
            'seo_score' => rand(60, 95)
        ]
    ],
    'timestamp' => date('c')
];

// Add small delay to simulate processing
usleep(300000); // 0.3 seconds

echo json_encode($mockResearchData);
?>