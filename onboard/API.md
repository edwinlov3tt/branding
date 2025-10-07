# JSON API Documentation

## Overview

The Marketing Research Tool provides a JSON API for programmatic access to cached marketing research reports. This API allows other applications to integrate market intelligence data for campaign analysis, AI context generation, and competitive research.

## Base URL
```
https://ignite.edwinlovett.com/research/
```

## Authentication
Currently no authentication required. Rate limiting applies (20 requests per hour per IP).

## Endpoints

### Get Cached Report

Retrieve a marketing research report in JSON format.

```http
GET /research/?company={domain}&format=json
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `company` | string | Yes | Domain name to retrieve report for |
| `format` | string | No | Response format: `json` or `html` (default: `html`) |

#### Example Request
```bash
curl "https://ignite.edwinlovett.com/research/?company=californiaclosets.com&format=json"
```

#### Response Format

##### Successful Response (200 OK)
```json
{
  "success": true,
  "cached": true,
  "cache_date": "2024-01-15T10:30:00Z",
  "cache_age_days": 5,
  "domain": "californiaclosets.com",
  "report": {
    "companyInfo": {
      "name": "California Closets",
      "industry": "Home Organization & Storage",
      "headquarters": "Novato, CA",
      "website": "californiaclosets.com",
      "founded": "1978"
    },
    "marketResearch": {
      "summary": "Market analysis summary...",
      "targetDemographics": "Homeowners aged 35-65..."
    },
    "competitorAnalysis": [
      {
        "name": "The Container Store",
        "website": "containerstore.com",
        "marketPosition": "Premium storage solutions"
      }
    ],
    "marketingInsights": {
      "summary": "Key marketing insights...",
      "recommendations": [...]
    },
    "socialMedia": {
      "facebook": "https://facebook.com/californiaclosets",
      "instagram": "https://instagram.com/californiaclosets"
    },
    "adLibrary": [
      {
        "platform": "Facebook",
        "title": "Custom Storage Solutions",
        "description": "Transform your space..."
      }
    ]
  },
  "metadata": {
    "generation_cost": 0.0456,
    "api_cost": 0.0234,
    "search_cost": 0.0222,
    "search_count": 5,
    "input_tokens": 1250,
    "output_tokens": 3400,
    "api_version": "1.0"
  }
}
```

##### No Report Found (200 OK)
```json
{
  "success": false,
  "cached": false,
  "error": "No cached report found for this domain",
  "domain": "example.com",
  "suggestion": "Generate a report first by visiting without format=json parameter"
}
```

##### Invalid Domain (400 Bad Request)
```json
{
  "success": false,
  "error": "Invalid domain format. Please provide a valid website URL or domain name.",
  "domain": "invalid-input"
}
```

##### Server Error (500 Internal Server Error)
```json
{
  "success": false,
  "error": "Failed to retrieve cached report",
  "domain": "example.com"
}
```

## Data Privacy & Security

### Personal Information Removal
The JSON API automatically removes all personally identifiable information (PII) from reports:

- ✅ **Removed**: Decision makers, contact emails, phone numbers, LinkedIn profiles
- ✅ **Removed**: Enrichment data, personal social media accounts
- ✅ **Included**: Company information, market insights, competitor analysis, public social media

### Rate Limiting
- **20 requests per hour** per IP address
- **3 requests per 5 minutes** burst protection
- **25 requests per 5 minutes** global system limit

Rate limit exceeded responses:
```json
{
  "success": false,
  "error": "Hourly limit exceeded (15 requests/hour)",
  "retry_after": 3600
}
```

## Client Examples

### JavaScript
```javascript
async function getMarketingReport(domain) {
    const response = await fetch(
        `https://ignite.edwinlovett.com/research/?company=${domain}&format=json`
    );
    return await response.json();
}

// Usage
const report = await getMarketingReport('californiaclosets.com');
if (report.success) {
    console.log('Company:', report.report.companyInfo.name);
    console.log('Industry:', report.report.companyInfo.industry);
}
```

### Python
```python
import requests

def get_marketing_report(domain):
    response = requests.get(
        'https://ignite.edwinlovett.com/research/',
        params={'company': domain, 'format': 'json'}
    )
    return response.json()

# Usage
report = get_marketing_report('californiaclosets.com')
if report['success']:
    print(f"Company: {report['report']['companyInfo']['name']}")
    print(f"Industry: {report['report']['companyInfo']['industry']}")
```

### PHP
```php
function getMarketingReport($domain) {
    $url = 'https://ignite.edwinlovett.com/research/?' . 
           http_build_query(['company' => $domain, 'format' => 'json']);
    
    $response = file_get_contents($url);
    return json_decode($response, true);
}

// Usage
$report = getMarketingReport('californiaclosets.com');
if ($report['success']) {
    echo "Company: " . $report['report']['companyInfo']['name'];
}
```

### cURL
```bash
# Basic request
curl "https://ignite.edwinlovett.com/research/?company=californiaclosets.com&format=json"

# With JSON formatting
curl "https://ignite.edwinlovett.com/research/?company=californiaclosets.com&format=json" | jq .
```

## Use Cases

### Campaign Analysis
```javascript
async function analyzeCampaign(campaignData, companyDomain) {
    const report = await getMarketingReport(companyDomain);
    
    return {
        campaign: campaignData,
        context: {
            industry: report.report.companyInfo.industry,
            competitors: report.report.competitorAnalysis,
            marketPosition: report.report.marketingInsights
        }
    };
}
```

### AI Context Generation
```javascript
async function getAIContext(domain) {
    const report = await getMarketingReport(domain);
    
    return `
Company: ${report.report.companyInfo.name}
Industry: ${report.report.companyInfo.industry}
Key Competitors: ${report.report.competitorAnalysis.map(c => c.name).join(', ')}
Marketing Focus: ${report.report.marketingInsights.summary}
    `;
}
```

## Response Schema

### Report Structure
```typescript
interface MarketingReport {
  companyInfo: {
    name: string;
    industry?: string;
    headquarters?: string;
    website: string;
    founded?: string;
    description?: string;
    employees?: string;
    revenue?: string;
  };
  marketResearch?: {
    summary: string;
    targetDemographics?: string;
    marketSize?: string;
    trends?: string[];
  };
  competitorAnalysis?: Array<{
    name: string;
    website?: string;
    marketPosition?: string;
    strengths?: string[];
    weaknesses?: string[];
  }>;
  marketingInsights?: {
    summary: string;
    recommendations?: string[];
    targetDemographics?: string;
    messagingStrategy?: string;
  };
  socialMedia?: {
    [platform: string]: string; // URLs
  };
  adLibrary?: Array<{
    platform: string;
    title?: string;
    description?: string;
    imageUrl?: string;
    ctaText?: string;
  }>;
}
```

### Metadata Structure
```typescript
interface Metadata {
  generation_cost: number;  // Total cost in USD
  api_cost: number;         // API usage cost
  search_cost: number;      // Search operation cost
  search_count: number;     // Number of searches performed
  input_tokens: number;     // Tokens sent to AI
  output_tokens: number;    // Tokens received from AI
  api_version: string;      // API version (e.g., "1.0")
}
```

## Error Handling

### Common Errors

| Error | Status | Description | Solution |
|-------|--------|-------------|----------|
| Domain parameter required | 400 | Missing company parameter | Add `?company=domain.com` |
| Invalid domain format | 400 | Domain validation failed | Use valid domain format |
| No cached report found | 200 | Domain has no cached data | Generate report first without format=json |
| Rate limit exceeded | 429 | Too many requests | Wait and retry after specified time |
| Server error | 500 | Internal system error | Retry request later |

### Best Practices

1. **Handle Rate Limits**: Implement exponential backoff for 429 responses
2. **Check Success Field**: Always check `response.success` before accessing data
3. **Cache Responses**: API responses include cache age - cache appropriately
4. **Error Recovery**: Provide fallback behavior when API is unavailable
5. **Respect Limits**: Don't exceed rate limits to maintain service availability

## Changelog

### Version 1.0 (Current)
- Initial JSON API implementation
- PII removal and data sanitization
- Rate limiting and error handling
- Comprehensive response metadata

### Planned Features
- Field selection (`?fields=companyInfo,competitors`)
- Webhook notifications for report updates
- API key authentication
- GraphQL endpoint
- Batch API for multiple domains

## Support

For API issues or questions:
- Check the implementation examples in `/docs/`
- Review error messages for specific guidance
- Ensure requests follow the documented format