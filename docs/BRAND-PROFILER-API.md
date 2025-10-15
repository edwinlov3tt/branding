# Brand Profiler API Documentation

Comprehensive brand analysis API that creates detailed brand profiles by scraping websites and aggregating customer reviews from Google, Yelp, and Facebook.

## Base URL

```
https://brand-profiler.yourname.workers.dev
```

## Overview

The Brand Profiler analyzes a company's website and customer reviews to generate a structured brand profile including:
- Brand positioning, voice, and personality
- Target audience and value propositions
- Writing style guidelines
- Customer sentiment analysis (from reviews)

## Endpoints

### 1. POST `/brand-profile` - Start Async Analysis

Creates a comprehensive brand profile. Returns a job ID for polling results.

**Request**:
```bash
curl -X POST https://brand-profiler.yourname.workers.dev/brand-profile \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "example.com",
    "includeReviews": true,
    "maxPages": 20
  }'
```

**Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `domain` | string | Yes | - | Company domain (with or without https://) |
| `includeReviews` | boolean | No | `true` | Fetch and analyze customer reviews |
| `maxPages` | number | No | `20` | Maximum pages to scrape (1-50) |

**Response** (`202 Accepted`):
```json
{
  "jobId": "abc123-xyz789",
  "status": "processing",
  "estimatedTime": 60,
  "statusUrl": "/brand-profile/abc123-xyz789"
}
```

---

### 2. GET `/brand-profile/{jobId}` - Get Analysis Results

Poll for results using the job ID from the async endpoint.

**Request**:
```bash
curl https://brand-profiler.yourname.workers.dev/brand-profile/abc123-xyz789
```

**Response** (Processing):
```json
{
  "jobId": "abc123-xyz789",
  "status": "processing",
  "domain": "example.com",
  "startedAt": "2025-10-09T12:00:00Z",
  "progress": {
    "discovery": true,
    "discoveryData": { "pagesFound": 18 },
    "scraping": true,
    "scrapingData": { "pagesScraped": 18 },
    "reviews": false,
    "synthesis": false
  }
}
```

**Response** (Completed - `200 OK`):
```json
{
  "jobId": "abc123-xyz789",
  "status": "completed",
  "domain": "example.com",
  "startedAt": "2025-10-09T12:00:00Z",
  "completedAt": "2025-10-09T12:01:15Z",
  "brandProfile": {
    "brand": {
      "name": "Example Company",
      "tagline": "Your trusted partner",
      "story": "Founded in 2010...",
      "mission": "To deliver exceptional service...",
      "positioning": "Premium service provider for small businesses",
      "valueProps": [
        "Same-day service",
        "Upfront pricing",
        "Certified technicians"
      ]
    },
    "voice": {
      "personality": ["professional", "friendly", "confident"],
      "toneSliders": {
        "formal": 60,
        "playful": 20,
        "premium": 75,
        "technical": 55,
        "energetic": 65
      },
      "lexicon": {
        "preferred": [
          "certified",
          "same-day service",
          "upfront pricing",
          "trusted"
        ],
        "avoid": [
          "cheap",
          "#1 without proof",
          "best ever"
        ]
      }
    },
    "audience": {
      "primary": "Busy homeowners and small business owners",
      "needs": [
        "Fast, reliable service",
        "Transparent pricing",
        "Professional expertise"
      ],
      "painPoints": [
        "Unreliable contractors",
        "Hidden fees",
        "Poor communication"
      ]
    },
    "writingGuide": {
      "sentenceLength": "short",
      "paragraphStyle": "2-3 short sentences per paragraph. Use active voice.",
      "formatting": "Use Title Case for headlines. Bullet points for lists. Bold for emphasis.",
      "avoid": [
        "No emojis",
        "No superlatives without proof",
        "Avoid jargon"
      ]
    }
  },
  "insights": {
    "pagesCrawled": 18,
    "reviewsAnalyzed": 324,
    "duration": "58.3s",
    "sources": {
      "google": 156,
      "yelp": 89,
      "facebook": 79
    }
  }
}
```

**Response** (Failed):
```json
{
  "jobId": "abc123-xyz789",
  "status": "failed",
  "domain": "example.com",
  "startedAt": "2025-10-09T12:00:00Z",
  "completedAt": "2025-10-09T12:00:45Z",
  "error": "Failed to scrape homepage: timeout"
}
```

---

### 3. POST `/brand-profile/sync` - Fast Synchronous Analysis

Quick analysis (25-30s) with limited data. No review aggregation, only top 5 pages.

**Request**:
```bash
curl -X POST https://brand-profiler.yourname.workers.dev/brand-profile/sync \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "example.com",
    "maxPages": 5
  }'
```

**Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `domain` | string | Yes | - | Company domain |
| `maxPages` | number | No | `5` | Maximum pages (max: 5 for sync) |

**Response** (`200 OK`):
```json
{
  "status": "completed",
  "domain": "example.com",
  "brandProfile": { /* same structure as async */ },
  "note": "Synchronous mode - limited to 5 pages, no reviews"
}
```

---

## Brand Profile Schema

### Complete Structure

```json
{
  "brand": {
    "name": "string",
    "tagline": "string",
    "story": "string (optional)",
    "mission": "string (optional)",
    "positioning": "string",
    "valueProps": ["string"]
  },
  "voice": {
    "personality": ["string"],
    "toneSliders": {
      "formal": 0-100,
      "playful": 0-100,
      "premium": 0-100,
      "technical": 0-100,
      "energetic": 0-100
    },
    "lexicon": {
      "preferred": ["string"],
      "avoid": ["string"]
    }
  },
  "audience": {
    "primary": "string",
    "needs": ["string"],
    "painPoints": ["string"]
  },
  "writingGuide": {
    "sentenceLength": "short | medium | long",
    "paragraphStyle": "string",
    "formatting": "string",
    "avoid": ["string"]
  }
}
```

---

## How It Works

### Discovery Phase (2-5s)
1. Fetches homepage and sitemap in parallel
2. Extracts navigation links
3. Classifies page types (home, about, services, blog, etc.)
4. Scores and prioritizes URLs
5. Applies diversity caps (max 8 service pages, max 5 blog posts, etc.)
6. Selects top N pages based on priority

### Scraping Phase (15-25s)
1. Scrapes selected pages in batches (5 concurrent)
2. Extracts title, meta description, and text content
3. Uses Scrapfly fallback if anti-bot protection detected
4. Stores extracted content for analysis

### Review Aggregation Phase (10-30s, parallel with scraping)
1. **Google Reviews**: Outscraper API (with polling)
2. **Yelp Reviews**: Outscraper API (with polling)
3. **Facebook Reviews**: RapidAPI (instant)
4. Extracts ratings, review text, and sentiment keywords
5. Continues even if one source times out

### Synthesis Phase (10-20s)
1. Prepares context from top 10 pages
2. Includes review summaries and themes
3. Calls Claude (or GPT) with structured prompt
4. Parses and validates JSON response
5. Returns structured brand profile

---

## Page Type Classification

The system automatically classifies pages:

| Type | Examples | Priority | Cap |
|------|----------|----------|-----|
| `home` | `/`, `/index.html` | 10.0 | 1 |
| `about` | `/about`, `/our-story` | 9.1 | 2 |
| `services_hub` | `/services` | 8.9 | 1 |
| `service` | `/services/repair` | 8.5 | 8 |
| `pricing` | `/pricing` | 7.9 | 1 |
| `reviews` | `/reviews`, `/testimonials` | 7.7 | 1 |
| `case_study` | `/case-studies/*` | 7.2 | 3 |
| `faq` | `/faq` | 7.0 | 1 |
| `contact` | `/contact` | 6.7 | 1 |
| `blog` | `/blog` | 5.8 | 1 |
| `post` | `/blog/*` | 5.4 | 5 |
| `policy` | `/privacy`, `/terms` | 3.5 | 2 |

---

## Environment Variables

Required API keys (set via `wrangler secret put`):

| Variable | Required | Purpose |
|----------|----------|---------|
| `ANTHROPIC_API_KEY` | Yes* | Claude AI for brand analysis |
| `OPENAI_API_KEY` | Yes* | GPT for brand analysis (fallback) |
| `SCRAPFLY_API_KEY` | No | Anti-bot bypass for protected sites |
| `OUTSCRAPER_API_KEY` | No | Google & Yelp review scraping |
| `RAPIDAPI_KEY` | No | Facebook review scraping |

*At least one LLM API key required (Claude or GPT)

---

## Setup & Deployment

### 1. Install Dependencies
```bash
npm install -g wrangler
```

### 2. Configure Secrets
```bash
# Required (choose one or both)
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put OPENAI_API_KEY

# Optional (for reviews)
wrangler secret put OUTSCRAPER_API_KEY
wrangler secret put RAPIDAPI_KEY
wrangler secret put SCRAPFLY_API_KEY
```

### 3. Deploy
```bash
wrangler deploy --config wrangler-brand.toml
```

### 4. Test
```bash
curl -X POST https://brand-profiler.yourname.workers.dev/brand-profile \
  -H "Content-Type: application/json" \
  -d '{"domain": "example.com"}'
```

---

## Performance Optimization

### Current Optimizations
1. **Parallel Execution**: Scraping + reviews run simultaneously
2. **Batch Processing**: 5 pages scraped concurrently
3. **Smart Timeouts**: Individual page timeout 15s, reviews timeout 20s
4. **Caching**: Cloudflare edge cache (30min) for page fetches
5. **Diversity Caps**: Prevents over-representation of similar pages

### Future Optimizations
1. **KV Caching**: Cache page scrapes and reviews (1-6 hours)
2. **Incremental Updates**: Update only changed pages
3. **Streaming Response**: Return partial results as available
4. **R2 Storage**: Store raw page content for re-analysis
5. **Queue-Based**: Use Cloudflare Queues for better throughput

---

## Rate Limits

### Worker Limits
- **CPU Time**: 50,000ms (50 seconds)
- **Memory**: 128 MB
- **Concurrent**: 1000 requests

### External API Limits
- **Outscraper**: Varies by plan (typically 100-1000 requests/month)
- **RapidAPI**: Varies by plan
- **Claude/GPT**: Varies by plan (rate limits apply)

---

## Error Handling

All errors return appropriate HTTP status codes:

| Status | Meaning |
|--------|---------|
| `202` | Analysis started successfully |
| `200` | Analysis completed or in progress |
| `400` | Invalid request (missing domain, etc.) |
| `404` | Job ID not found |
| `500` | Internal error (see error message) |

---

## Use Cases

1. **Content Marketing**: Generate on-brand copy and ads
2. **Competitive Analysis**: Understand competitor positioning
3. **Brand Audits**: Identify voice consistency issues
4. **Onboarding**: Quickly understand new client brands
5. **Training LLMs**: Create brand style guides for AI

---

