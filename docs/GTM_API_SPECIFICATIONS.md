# GTM API Specifications for Branding AI Platform

## Custom Endpoint Requests for gtm.edwinlovett.com

This document specifies the exact API requirements for seamless integration with the Branding AI platform, ensuring zero errors and optimal performance.

---

## 1. New Custom Endpoint: `/api/brand-intelligence-extract`

### Purpose
Single endpoint optimized specifically for brand intelligence extraction, returning data that maps directly to our `brand_intelligence` database schema.

### Request Format

**POST** `https://gtm.edwinlovett.com/api/brand-intelligence-extract`

```json
{
  "url": "https://example.com",
  "analysis_depth": "standard",  // "quick" | "standard" | "deep"
  "include_competitors": false,  // Optional: auto-detect competitors
  "webhook_url": "https://yourapp.com/api/webhooks/brand-analysis",  // Optional
  "job_id": "uuid"  // Optional: for tracking
}
```

### Response Format (Should Match Our Database Schema)

```json
{
  "success": true,
  "job_id": "uuid",
  "analysis_time": "2024-10-08T04:30:00Z",

  "brand_intelligence": {
    // Core identity (maps to brand_intelligence table)
    "brand_name": "Example Corp",
    "tagline": "Innovation at Scale",
    "mission": "To revolutionize how businesses...",
    "vision": "A world where...",
    "values": ["Innovation", "Integrity", "Customer-First"],

    // Voice & Tone
    "brand_tone": "professional yet approachable",
    "brand_voice": {
      "formality": "semi-formal",
      "enthusiasm": "high",
      "professionalism": "high",
      "friendliness": "medium"
    },

    // Messaging
    "messaging_themes": [
      "Digital transformation",
      "Cost efficiency",
      "Innovation leadership"
    ],
    "key_messages": [
      "We help businesses scale faster",
      "Trusted by 10,000+ companies",
      "24/7 support included"
    ],

    // Market positioning
    "industry": "SaaS / Technology",
    "target_market": "SMBs and mid-market companies",
    "unique_value_proposition": "Only platform that combines X with Y",

    // Content analysis
    "content_themes": [
      "Product features",
      "Customer success stories",
      "Industry thought leadership"
    ],

    // Metadata
    "pages_analyzed": 15,
    "confidence_score": 0.87,  // 0.0 to 1.0

    // Optional: Auto-detected competitors
    "detected_competitors": [
      {
        "name": "Competitor A",
        "website": "https://competitor-a.com",
        "similarity_score": 0.82
      }
    ]
  },

  // Visual identity (bonus)
  "visual_identity": {
    "primary_color": "#1E40AF",
    "color_palette": ["#1E40AF", "#10B981", "#F59E0B"],
    "logo_url": "https://example.com/logo.png",
    "typography": {
      "display_font": "Inter",
      "body_font": "Inter"
    }
  },

  // Raw data for storage
  "raw_analysis": {
    // Full analysis data for debugging/future use
  }
}
```

### SSE Progress Events

If processing takes > 5 seconds, stream progress:

```
event: progress
data: {"progress": 10, "step": "Discovering pages", "total_steps": 5}

event: progress
data: {"progress": 30, "step": "Analyzing page content", "total_steps": 5}

event: progress
data: {"progress": 60, "step": "Extracting brand elements", "total_steps": 5}

event: progress
data: {"progress": 85, "step": "AI analysis", "total_steps": 5}

event: complete
data: {"progress": 100, "step": "Complete", "result": {...}}
```

### Error Format (Standardized)

```json
{
  "success": false,
  "error": {
    "code": "INVALID_URL",  // or "ANALYSIS_FAILED", "TIMEOUT", etc
    "message": "Unable to access the provided URL",
    "details": "Connection timeout after 30 seconds",
    "retry_recommended": true,
    "suggested_action": "Check if the website is accessible and try again"
  },
  "job_id": "uuid"
}
```

---

## 2. Webhook Support for Long-Running Operations

### Enable Webhooks

When `webhook_url` is provided in request, POST results when complete:

**POST** to client's `webhook_url`:

```json
{
  "event": "brand_analysis_complete",
  "job_id": "uuid",
  "timestamp": "2024-10-08T04:30:00Z",
  "status": "completed",  // or "failed"
  "result": {
    // Same as response format above
  }
}
```

### Webhook Security

Include signature header for verification:

```
X-GTM-Signature: sha256=abc123...
X-GTM-Timestamp: 1633024800
```

---

## 3. Enhanced `/api/analyze-brand-enhanced` Improvements

### Current Issues to Fix

1. **SSE Event Structure**: Ensure consistent format
2. **Progress Mapping**: Use 0-100 scale with clear steps
3. **Completion Event**: Always send final complete event
4. **Error Handling**: Graceful failures with retry info

### Recommended Changes

**Current (Inconsistent)**:
```javascript
// Sometimes sends:
data: analyzing pages
// Sometimes sends:
data: {"progress": 50}
// Sometimes sends JSON, sometimes plain text
```

**Improved (Consistent)**:
```javascript
// Always valid JSON
event: progress
data: {"progress": 10, "step": "Discovering pages", "pages_found": 12}

event: progress
data: {"progress": 45, "step": "Scraping page 3 of 15", "current_page": "https://..."}

event: progress
data: {"progress": 80, "step": "AI analysis", "substep": "Extracting mission statement"}

event: complete
data: {"progress": 100, "result": {...full result object...}}

event: error
data: {"error": "Connection timeout", "code": "TIMEOUT", "retry": true}
```

---

## 4. Rate Limiting & Performance Headers

### Add Response Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1633024800
X-Processing-Time: 45.2s
X-Pages-Analyzed: 15
```

---

## 5. Testing Endpoints

### Test URLs to Support

Create test endpoints that return consistent results for testing:

```
POST /api/test/brand-analysis-success
POST /api/test/brand-analysis-slow (simulates 60s processing)
POST /api/test/brand-analysis-failure (simulates various errors)
```

**Example Test Request**:
```json
{
  "test_scenario": "standard_success",
  // or "timeout", "invalid_url", "partial_data", etc
  "delay_seconds": 5  // Optional: simulate processing time
}
```

---

## 6. Batch Processing Endpoint (Future)

### For Multiple Brands at Once

**POST** `/api/batch/brand-intelligence`

```json
{
  "brands": [
    {"url": "https://brand1.com", "job_id": "uuid-1"},
    {"url": "https://brand2.com", "job_id": "uuid-2"},
    {"url": "https://brand3.com", "job_id": "uuid-3"}
  ],
  "webhook_url": "https://yourapp.com/api/webhooks/batch-complete",
  "priority": "normal"  // or "high"
}
```

**Response**:
```json
{
  "success": true,
  "batch_id": "uuid",
  "jobs": [
    {"url": "https://brand1.com", "job_id": "uuid-1", "status": "queued"},
    {"url": "https://brand2.com", "job_id": "uuid-2", "status": "queued"},
    {"url": "https://brand3.com", "job_id": "uuid-3", "status": "queued"}
  ],
  "estimated_completion": "2024-10-08T05:00:00Z"
}
```

---

## 7. Health Check & Status Endpoints

### GET `/api/health`

```json
{
  "status": "operational",
  "services": {
    "crawler": "operational",
    "ai_analysis": "operational",
    "database": "operational"
  },
  "performance": {
    "avg_response_time": "32.5s",
    "queue_depth": 3,
    "processing_capacity": "95%"
  }
}
```

### GET `/api/status/:job_id`

```json
{
  "job_id": "uuid",
  "status": "processing",  // queued, processing, completed, failed
  "progress": 45,
  "current_step": "Analyzing page 3 of 15",
  "started_at": "2024-10-08T04:25:00Z",
  "estimated_completion": "2024-10-08T04:27:30Z"
}
```

---

## 8. Error Codes Reference

### Standard Error Codes

```javascript
const ERROR_CODES = {
  // Input errors (4xx)
  INVALID_URL: 'The provided URL is malformed',
  INACCESSIBLE_URL: 'Unable to access the website',
  PROTECTED_CONTENT: 'Website requires authentication',
  RATE_LIMIT_EXCEEDED: 'Too many requests, retry after X seconds',

  // Processing errors (5xx)
  ANALYSIS_FAILED: 'Analysis could not complete',
  AI_SERVICE_ERROR: 'AI processing failed',
  TIMEOUT: 'Analysis exceeded maximum time',
  INSUFFICIENT_DATA: 'Not enough data to generate analysis',

  // System errors
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
  INTERNAL_ERROR: 'Internal server error'
}
```

### Error Response Template

```json
{
  "success": false,
  "error": {
    "code": "TIMEOUT",
    "message": "Analysis exceeded maximum processing time of 180 seconds",
    "retry_recommended": true,
    "retry_after": 300,  // seconds
    "support_reference": "ref-abc123",  // For support tickets
    "suggestions": [
      "Try reducing maxPages parameter",
      "Website may be experiencing high load",
      "Contact support if issue persists"
    ]
  }
}
```

---

## 9. Recommended Claude Integration

### Prompt Template for Brand Intelligence

Since you control the Claude integration, use this optimized prompt template:

```javascript
const BRAND_INTELLIGENCE_PROMPT = `You are a brand intelligence analyst. Analyze the following website data and extract structured brand intelligence.

Website Data:
${JSON.stringify(websiteData, null, 2)}

Extract the following in valid JSON format ONLY (no other text):

{
  "brand_name": "Official brand name",
  "tagline": "Main tagline or slogan",
  "mission": "Mission statement (1-2 sentences)",
  "vision": "Vision statement if present",
  "values": ["value1", "value2", "value3"],
  "brand_tone": "Overall tone (e.g., professional, friendly, innovative)",
  "brand_voice": {
    "formality": "formal/semi-formal/casual",
    "enthusiasm": "high/medium/low",
    "professionalism": "high/medium/low"
  },
  "messaging_themes": ["theme1", "theme2"],
  "key_messages": ["message1", "message2"],
  "industry": "Industry/vertical",
  "target_market": "Description of target market",
  "unique_value_proposition": "What makes them unique",
  "content_themes": ["theme1", "theme2"],
  "confidence_score": 0.85
}

Rules:
1. Only include data that is clearly present
2. Use null for missing data
3. Be concise - 1-2 sentences max per field
4. confidence_score should be 0.0-1.0 based on data quality
5. Return ONLY valid JSON, no explanations

JSON:`;
```

### Response Validation

After Claude responds, validate the structure:

```javascript
function validateBrandIntelligence(data) {
  const required = ['brand_name', 'industry'];
  const hasRequired = required.every(field => data[field]);

  if (!hasRequired) {
    throw new Error('Missing required fields');
  }

  // Ensure arrays
  if (!Array.isArray(data.values)) data.values = [];
  if (!Array.isArray(data.key_messages)) data.key_messages = [];

  // Validate confidence score
  if (typeof data.confidence_score !== 'number' ||
      data.confidence_score < 0 ||
      data.confidence_score > 1) {
    data.confidence_score = 0.5;  // Default
  }

  return data;
}
```

---

## 10. Performance Optimizations

### Caching Strategy

```
Cache-Control: public, max-age=86400
ETag: "abc123..."
```

For repeated analysis of same URL:
1. Check if analysis exists (< 24 hours old)
2. Return cached result with `X-Cache: HIT` header
3. Optionally allow `force_refresh=true` parameter

### Parallel Processing

For `maxPages > 5`, process pages in parallel:
- Batch size: 3-5 pages simultaneously
- Update progress for each batch completion

---

## 11. Documentation Endpoint

### GET `/api/docs/schema`

Return JSON schema for all endpoints:

```json
{
  "endpoints": {
    "/api/brand-intelligence-extract": {
      "method": "POST",
      "request_schema": {...},
      "response_schema": {...},
      "examples": [...]
    }
  }
}
```

---

## Summary: Priority Implementation List

### High Priority (Do These First)

1. ✅ **Consistent SSE format** - All events as JSON with `event` and `data` fields
2. ✅ **Standardized progress** - 0-100 scale with clear step descriptions
3. ✅ **Error response format** - Use standardized error codes and messages
4. ✅ **Completion event** - Always send final `complete` or `error` event
5. ✅ **Response validation** - Ensure all JSON is valid and parseable

### Medium Priority

6. ⚡ **Custom endpoint** - `/api/brand-intelligence-extract` with optimized schema
7. ⚡ **Webhook support** - POST results to callback URL when complete
8. ⚡ **Status endpoint** - `/api/status/:job_id` for polling job progress
9. ⚡ **Performance headers** - Rate limits, processing time, pages analyzed

### Low Priority (Nice to Have)

10. 🔮 **Batch processing** - Analyze multiple brands at once
11. 🔮 **Test endpoints** - Simulate various scenarios for testing
12. 🔮 **Health check** - Service status and performance metrics
13. 🔮 **Caching** - Cache recent analyses for faster responses

---

## Testing Checklist for gtm.edwinlovett.com

Once implemented, test these scenarios:

### Happy Path
- [ ] Simple website (5 pages) completes successfully
- [ ] Complex website (15 pages) with SSE progress events
- [ ] Progress events are valid JSON
- [ ] Final result matches schema
- [ ] All required fields are populated

### Error Scenarios
- [ ] Invalid URL returns appropriate error
- [ ] Inaccessible website (404, 500) handled gracefully
- [ ] Timeout after 180s returns error with retry info
- [ ] Protected content (requires auth) returns clear message
- [ ] Rate limit exceeded returns retry-after header

### Edge Cases
- [ ] JavaScript-heavy SPA loads correctly
- [ ] Website with no clear brand info returns partial data
- [ ] Very slow website (3s+ per page) streams progress
- [ ] Incomplete analysis still returns usable data

### Integration
- [ ] SSE parsing works without errors
- [ ] Webhook is called on completion (if provided)
- [ ] Status polling works during processing
- [ ] Error messages are user-friendly

---

## Example Implementation in Your Backend

Once gtm.edwinlovett.com implements these specs:

```javascript
// Clean, error-free integration
async function generateBrandIntelligence(brandId, url) {
  // Start analysis with webhook
  const response = await axios.post(
    'https://gtm.edwinlovett.com/api/brand-intelligence-extract',
    {
      url,
      analysis_depth: 'standard',
      webhook_url: `${process.env.API_BASE_URL}/api/webhooks/brand-analysis`,
      job_id: brandId  // For tracking
    },
    {
      timeout: 5000,  // Just to start the job
      responseType: 'stream'
    }
  )

  // If immediate response (quick analysis)
  if (response.headers['content-type'].includes('application/json')) {
    return response.data.brand_intelligence
  }

  // If SSE stream (longer analysis)
  return new Promise((resolve, reject) => {
    let result = null

    response.data.on('data', (chunk) => {
      const lines = chunk.toString().split('\n')

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          const event = line.substring(7)
          const dataLine = lines[lines.indexOf(line) + 1]

          if (dataLine?.startsWith('data: ')) {
            const data = JSON.parse(dataLine.substring(6))

            if (event === 'complete') {
              result = data.result.brand_intelligence
            } else if (event === 'error') {
              reject(new Error(data.error.message))
            } else if (event === 'progress') {
              // Update job progress in database
              updateJobProgress(brandId, data.progress, data.step)
            }
          }
        }
      }
    })

    response.data.on('end', () => {
      if (result) resolve(result)
      else reject(new Error('No result received'))
    })

    response.data.on('error', reject)
  })
}
```

---

## Questions to Ask Claude (gtm.edwinlovett.com)

When implementing these specs with Claude on gtm.edwinlovett.com, ask:

1. **"Can you modify the SSE event format to always return valid JSON with event and data fields?"**

2. **"Can you create a `/api/brand-intelligence-extract` endpoint that returns data matching this exact schema?"** (provide schema above)

3. **"Can you add webhook support so results are POSTed to a callback URL when analysis completes?"**

4. **"Can you standardize error responses with error codes, messages, and retry recommendations?"**

5. **"Can you add a `/api/status/:job_id` endpoint to poll job progress without SSE?"**

6. **"Can you add response headers for rate limiting and performance metrics?"**

Provide this entire document as the specification!
