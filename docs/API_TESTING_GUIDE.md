# API Testing Guide

Complete reference for all API endpoints in the Branding application. Use this guide to create automated tests.

**Base URL (Development):** `http://localhost:3001`
**Base URL (Production):** `https://your-railway-app.up.railway.app`

---

## Table of Contents

1. [Health & Status](#health--status)
2. [Brand Extraction](#brand-extraction)
3. [Brands CRUD](#brands-crud)
4. [Brand Assets](#brand-assets)
5. [Brand Profile](#brand-profile)
6. [Brand Images](#brand-images)
7. [Ad Inspirations](#ad-inspirations)
8. [Foreplay Integration](#foreplay-integration)
9. [Products & Services](#products--services)
10. [Competitors](#competitors)
11. [Target Audiences](#target-audiences)
12. [Campaigns](#campaigns)
13. [Brand Intelligence](#brand-intelligence)
14. [Brand Settings](#brand-settings)
15. [Competitor Analyses](#competitor-analyses)
16. [Generated Creatives](#generated-creatives)
17. [AI Generation Endpoints](#ai-generation-endpoints)
18. [Admin Endpoints](#admin-endpoints)

---

## Health & Status

### GET /health
Check if server is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-10T12:00:00.000Z"
}
```

**Test Command:**
```bash
curl http://localhost:3001/health
```

---

### GET /api/test-all
Test all external API connections.

**Response:**
```json
{
  "status": "ok",
  "tests": {
    "database": { "status": "ok", "responseTime": 5 },
    "brandExtractor": { "status": "ok", "responseTime": 150 },
    "brandProfiler": { "status": "ok", "responseTime": 200 }
  }
}
```

**Test Command:**
```bash
curl http://localhost:3001/api/test-all
```

---

### GET /status
Get server status with database connection info.

**Response:**
```json
{
  "server": "running",
  "database": "connected",
  "timestamp": "2025-11-10T12:00:00.000Z"
}
```

**Test Command:**
```bash
curl http://localhost:3001/status
```

---

## Brand Extraction

### POST /api/extract-brand
Extract brand assets (colors, fonts, logos) from a website.

**Request Body:**
```json
{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "success": true,
  "brand": {
    "colors": {
      "palette": [
        { "hex": "#dc2626", "role": "primary", "confidence": 0.95 }
      ]
    },
    "fonts": {
      "primary": {
        "family": "Inter",
        "category": "sans-serif",
        "weights": [400, 700]
      }
    },
    "logos": {
      "primary": {
        "src": "https://...",
        "width": 200,
        "height": 50
      }
    },
    "screenshot": {
      "url": "https://...",
      "width": 1920,
      "height": 1080
    }
  }
}
```

**Test Command:**
```bash
curl -X POST http://localhost:3001/api/extract-brand \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

---

### POST /api/discover-brand-pages
Discover additional pages on a website for comprehensive brand analysis.

**Request Body:**
```json
{
  "domain": "example.com",
  "maxPages": 15
}
```

**Response:**
```json
{
  "success": true,
  "pages": [
    {
      "url": "https://example.com/about",
      "title": "About Us",
      "category": "about",
      "relevanceScore": 0.95
    }
  ]
}
```

**Test Command:**
```bash
curl -X POST http://localhost:3001/api/discover-brand-pages \
  -H "Content-Type: application/json" \
  -d '{"domain": "example.com", "maxPages": 15}'
```

---

## Brands CRUD

### GET /api/brands
Get all brands for the current user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Example Brand",
      "slug": "example-brand",
      "short_id": "abc123",
      "website": "https://example.com",
      "created_at": "2025-11-10T12:00:00.000Z"
    }
  ]
}
```

**Test Command:**
```bash
curl http://localhost:3001/api/brands
```

---

### GET /api/brands/:slug/:shortId
Get a specific brand by slug and short ID.

**URL Parameters:**
- `slug` - Brand slug (e.g., "example-brand")
- `shortId` - Short ID (e.g., "abc123")

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Example Brand",
    "slug": "example-brand",
    "short_id": "abc123",
    "website": "https://example.com",
    "industry": "Technology",
    "created_at": "2025-11-10T12:00:00.000Z"
  }
}
```

**Test Command:**
```bash
curl http://localhost:3001/api/brands/example-brand/abc123
```

---

### POST /api/brands
Create a new brand.

**Request Body:**
```json
{
  "name": "Example Brand",
  "website": "https://example.com",
  "industry": "Technology",
  "description": "A technology company"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Example Brand",
    "slug": "example-brand",
    "short_id": "abc123",
    "website": "https://example.com",
    "industry": "Technology",
    "description": "A technology company",
    "created_at": "2025-11-10T12:00:00.000Z"
  }
}
```

**Test Command:**
```bash
curl -X POST http://localhost:3001/api/brands \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Example Brand",
    "website": "https://example.com",
    "industry": "Technology",
    "description": "A technology company"
  }'
```

---

### PUT /api/brands
Update an existing brand.

**Request Body:**
```json
{
  "id": "uuid",
  "name": "Updated Brand Name",
  "website": "https://updated.com",
  "industry": "Updated Industry",
  "description": "Updated description"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Updated Brand Name",
    "slug": "updated-brand-name",
    "updated_at": "2025-11-10T12:00:00.000Z"
  }
}
```

**Test Command:**
```bash
curl -X PUT http://localhost:3001/api/brands \
  -H "Content-Type: application/json" \
  -d '{
    "id": "uuid",
    "name": "Updated Brand Name"
  }'
```

---

### DELETE /api/brands
Delete a brand and all associated data.

**Query Parameters:**
- `id` - Brand UUID

**Response:**
```json
{
  "success": true,
  "message": "Brand deleted successfully"
}
```

**Test Command:**
```bash
curl -X DELETE "http://localhost:3001/api/brands?id=uuid"
```

---

## Brand Assets

### POST /api/brand-assets
Save brand assets (colors, fonts, logos) to database.

**Request Body:**
```json
{
  "brand_id": "uuid",
  "assets": {
    "colors": [...],
    "fonts": {...},
    "logos": {...},
    "screenshot": {...}
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "brand_id": "uuid",
    "assets": {...},
    "created_at": "2025-11-10T12:00:00.000Z"
  }
}
```

**Test Command:**
```bash
curl -X POST http://localhost:3001/api/brand-assets \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "uuid",
    "assets": {}
  }'
```

---

### GET /api/brand-assets
Get brand assets from database.

**Query Parameters:**
- `brand_id` - Brand UUID

**Response:**
```json
{
  "success": true,
  "data": {
    "brand": {
      "colors": {...},
      "fonts": {...},
      "logos": {...},
      "screenshot": {...}
    }
  }
}
```

**Test Command:**
```bash
curl "http://localhost:3001/api/brand-assets?brand_id=uuid"
```

---

## Brand Profile

### GET /api/brand-profile
Get brand profile data.

**Query Parameters:**
- `brand_id` - Brand UUID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "brand_id": "uuid",
    "brand_name": "Example Brand",
    "tagline": "Your tagline here",
    "story": "Brand story...",
    "mission": "Our mission...",
    "positioning": "Market positioning...",
    "value_props": ["Value 1", "Value 2"],
    "personality": ["trait1", "trait2"],
    "tone_sliders": {
      "formal": 70,
      "playful": 30,
      "premium": 80
    },
    "lexicon_preferred": ["word1", "word2"],
    "lexicon_avoid": ["word3", "word4"],
    "primary_audience": "Tech-savvy professionals",
    "audience_needs": ["need1", "need2"],
    "audience_pain_points": ["pain1", "pain2"],
    "sentence_length": "medium",
    "paragraph_style": "concise",
    "formatting_guidelines": "Use bullet points...",
    "writing_avoid": ["avoid1", "avoid2"],
    "pages_crawled": 15,
    "reviews_analyzed": 50,
    "confidence_score": 0.85,
    "profile_status": "completed"
  }
}
```

**Test Command:**
```bash
curl "http://localhost:3001/api/brand-profile?brand_id=uuid"
```

---

### POST /api/brand-profile
Create or update brand profile (manual).

**Request Body:**
```json
{
  "brand_id": "uuid",
  "brand_name": "Example Brand",
  "tagline": "Your tagline",
  "story": "Brand story...",
  "mission": "Mission statement...",
  "positioning": "Market positioning...",
  "value_props": ["Value 1", "Value 2"],
  "personality": ["innovative", "trustworthy"],
  "tone_sliders": {
    "formal": 70,
    "playful": 30
  },
  "lexicon_preferred": ["excellence", "innovation"],
  "lexicon_avoid": ["cheap", "basic"],
  "primary_audience": "Tech professionals",
  "audience_needs": ["efficiency", "reliability"],
  "audience_pain_points": ["slow processes", "complexity"],
  "sentence_length": "medium",
  "paragraph_style": "concise",
  "formatting_guidelines": "Use bullet points",
  "writing_avoid": ["jargon", "passive voice"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "brand_id": "uuid",
    ...
  }
}
```

**Test Command:**
```bash
curl -X POST http://localhost:3001/api/brand-profile \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "uuid",
    "brand_name": "Example Brand"
  }'
```

---

### PUT /api/brand-profile
Update specific fields in brand profile.

**Request Body:**
```json
{
  "brand_id": "uuid",
  "brand_name": "Updated Name",
  "tagline": "New tagline",
  "mission": "Updated mission"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "brand_id": "uuid",
    "brand_name": "Updated Name",
    "tagline": "New tagline",
    "updated_at": "2025-11-10T12:00:00.000Z"
  }
}
```

**Test Command:**
```bash
curl -X PUT http://localhost:3001/api/brand-profile \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "uuid",
    "brand_name": "Updated Name"
  }'
```

---

### POST /api/generate-brand-profile
Start async brand profile generation using Brand Profiler Worker.

**Request Body:**
```json
{
  "brand_id": "uuid",
  "domain": "example.com",
  "includeReviews": false,
  "maxPages": 15,
  "reviewIds": {
    "googlePlaceId": "optional",
    "yelpBusinessId": "optional"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "job-uuid",
    "status": "processing",
    "estimatedTime": 60,
    "statusUrl": "/api/brand-profile-status/job-uuid"
  }
}
```

**Test Command:**
```bash
curl -X POST http://localhost:3001/api/generate-brand-profile \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "uuid",
    "domain": "example.com",
    "includeReviews": false,
    "maxPages": 15
  }'
```

---

### GET /api/brand-profile-status/:jobId
Poll status of brand profile generation job.

**URL Parameters:**
- `jobId` - Job ID from generate-brand-profile

**Query Parameters:**
- `brand_id` - Brand UUID

**Response (Processing):**
```json
{
  "success": true,
  "status": "processing",
  "data": {
    "jobId": "job-uuid",
    "progress": 45
  }
}
```

**Response (Completed):**
```json
{
  "success": true,
  "status": "completed",
  "data": {
    "brandProfile": {
      "brand": {...},
      "voice": {...},
      "audience": {...},
      "writingGuide": {...}
    },
    "insights": {
      "pagesCrawled": 15,
      "reviewsAnalyzed": 50
    },
    "saved": true
  }
}
```

**Test Command:**
```bash
curl "http://localhost:3001/api/brand-profile-status/job-uuid?brand_id=uuid"
```

---

## Brand Images

### GET /api/brand-images
Get brand images by brand ID.

**Query Parameters:**
- `brand_id` - Brand UUID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "brand_id": "uuid",
      "page_url": "https://example.com/page",
      "page_title": "Page Title",
      "page_category": "hero",
      "relevance_score": 0.95,
      "images": [
        {
          "src": "https://...",
          "alt": "Image description",
          "width": 1920,
          "height": 1080
        }
      ],
      "images_count": 1
    }
  ]
}
```

**Test Command:**
```bash
curl "http://localhost:3001/api/brand-images?brand_id=uuid"
```

---

### POST /api/brand-images
Save brand images (single page or bulk).

**Request Body (Single Page):**
```json
{
  "brand_id": "uuid",
  "page_url": "https://example.com/page",
  "page_title": "Page Title",
  "page_category": "hero",
  "relevance_score": 0.95,
  "images": [...],
  "images_count": 5
}
```

**Request Body (Bulk):**
```json
{
  "brand_id": "uuid",
  "pages": [
    {
      "page_url": "https://...",
      "page_title": "Title",
      "images": [...]
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {...}
}
```

**Test Command:**
```bash
curl -X POST http://localhost:3001/api/brand-images \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "uuid",
    "page_url": "https://example.com",
    "images": []
  }'
```

---

## Ad Inspirations

### GET /api/ad-inspirations/curated
Get curated ad templates.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "is_curated": true,
      "template_name": "Template Name",
      "category": "social",
      "platform": "facebook",
      "ad_type": "image",
      "thumbnail_url": "https://...",
      "preview_url": "https://...",
      "headline": "Ad headline",
      "body_text": "Ad body text",
      "call_to_action": "Shop Now",
      "tags": ["tag1", "tag2"],
      "use_count": 10
    }
  ]
}
```

**Test Command:**
```bash
curl http://localhost:3001/api/ad-inspirations/curated
```

---

### GET /api/ad-inspirations
Get brand-specific ad inspirations.

**Query Parameters:**
- `brand_id` - Brand UUID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "brand_id": "uuid",
      "foreplay_id": "fp-id",
      "advertiser_name": "Brand Name",
      "platform": "facebook",
      "ad_type": "video",
      "thumbnail_url": "https://...",
      "preview_url": "https://...",
      "headline": "Ad headline",
      "body_text": "Body text",
      "cta_text": "Shop Now",
      "landing_page_url": "https://...",
      "first_seen": "2025-01-01",
      "last_seen": "2025-11-10",
      "is_active": true,
      "search_query": "keyword"
    }
  ]
}
```

**Test Command:**
```bash
curl "http://localhost:3001/api/ad-inspirations?brand_id=uuid"
```

---

### POST /api/ad-inspirations
Save ad inspiration to brand.

**Request Body:**
```json
{
  "brand_id": "uuid",
  "foreplay_id": "fp-id",
  "advertiser_name": "Brand Name",
  "platform": "facebook",
  "ad_type": "video",
  "thumbnail_url": "https://...",
  "preview_url": "https://...",
  "headline": "Headline",
  "body_text": "Body",
  "cta_text": "CTA",
  "landing_page_url": "https://...",
  "first_seen": "2025-01-01",
  "last_seen": "2025-11-10",
  "is_active": true,
  "search_query": "keyword"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    ...
  }
}
```

**Test Command:**
```bash
curl -X POST http://localhost:3001/api/ad-inspirations \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "uuid",
    "foreplay_id": "fp-id"
  }'
```

---

### DELETE /api/ad-inspirations
Delete ad inspiration.

**Query Parameters:**
- `id` - Ad inspiration UUID

**Response:**
```json
{
  "success": true,
  "message": "Ad inspiration deleted successfully"
}
```

**Test Command:**
```bash
curl -X DELETE "http://localhost:3001/api/ad-inspirations?id=uuid"
```

---

## Foreplay Integration

### POST /api/foreplay/search-ads
Search ads using Foreplay API.

**Request Body:**
```json
{
  "query": "fitness brands",
  "filters": {
    "platforms": ["facebook", "instagram"],
    "adTypes": ["video"],
    "dateRange": {
      "start": "2025-01-01",
      "end": "2025-11-10"
    }
  },
  "page": 1,
  "limit": 20
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ads": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100
    }
  }
}
```

**Test Command:**
```bash
curl -X POST http://localhost:3001/api/foreplay/search-ads \
  -H "Content-Type: application/json" \
  -d '{
    "query": "fitness brands",
    "page": 1,
    "limit": 20
  }'
```

---

## Products & Services

### GET /api/products-services
Get products/services for a brand.

**Query Parameters:**
- `brand_id` - Brand UUID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "brand_id": "uuid",
      "name": "Product Name",
      "type": "product",
      "description": "Product description",
      "features": ["feature1", "feature2"],
      "pricing_model": "subscription",
      "target_audience": "professionals",
      "key_benefits": ["benefit1", "benefit2"],
      "image_urls": ["https://..."]
    }
  ]
}
```

**Test Command:**
```bash
curl "http://localhost:3001/api/products-services?brand_id=uuid"
```

---

### POST /api/products-services
Create product/service.

**Request Body:**
```json
{
  "brand_id": "uuid",
  "name": "Product Name",
  "type": "product",
  "description": "Description",
  "features": ["feature1", "feature2"],
  "pricing_model": "subscription",
  "target_audience": "professionals",
  "key_benefits": ["benefit1"],
  "image_urls": ["https://..."]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    ...
  }
}
```

**Test Command:**
```bash
curl -X POST http://localhost:3001/api/products-services \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "uuid",
    "name": "Product Name",
    "type": "product"
  }'
```

---

### PUT /api/products-services
Update product/service.

**Request Body:**
```json
{
  "id": "uuid",
  "name": "Updated Name",
  "description": "Updated description"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    ...
  }
}
```

**Test Command:**
```bash
curl -X PUT http://localhost:3001/api/products-services \
  -H "Content-Type: application/json" \
  -d '{
    "id": "uuid",
    "name": "Updated Name"
  }'
```

---

### DELETE /api/products-services
Delete product/service.

**Query Parameters:**
- `id` - Product UUID

**Response:**
```json
{
  "success": true,
  "message": "Product/service deleted successfully"
}
```

**Test Command:**
```bash
curl -X DELETE "http://localhost:3001/api/products-services?id=uuid"
```

---

## Competitors

### GET /api/competitors
Get competitors for a brand.

**Query Parameters:**
- `brand_id` - Brand UUID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "brand_id": "uuid",
      "name": "Competitor Name",
      "website": "https://competitor.com",
      "market_position": "Leader",
      "strengths": ["strength1", "strength2"],
      "weaknesses": ["weakness1"],
      "key_differentiators": ["diff1"]
    }
  ]
}
```

**Test Command:**
```bash
curl "http://localhost:3001/api/competitors?brand_id=uuid"
```

---

### POST /api/competitors
Create competitor.

**Request Body:**
```json
{
  "brand_id": "uuid",
  "name": "Competitor Name",
  "website": "https://competitor.com",
  "market_position": "Leader",
  "strengths": ["strength1"],
  "weaknesses": ["weakness1"],
  "key_differentiators": ["diff1"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    ...
  }
}
```

**Test Command:**
```bash
curl -X POST http://localhost:3001/api/competitors \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "uuid",
    "name": "Competitor Name"
  }'
```

---

### PUT /api/competitors
Update competitor.

**Request Body:**
```json
{
  "id": "uuid",
  "name": "Updated Name",
  "market_position": "Updated position"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    ...
  }
}
```

**Test Command:**
```bash
curl -X PUT http://localhost:3001/api/competitors \
  -H "Content-Type: application/json" \
  -d '{
    "id": "uuid",
    "name": "Updated Name"
  }'
```

---

### DELETE /api/competitors
Delete competitor.

**Query Parameters:**
- `id` - Competitor UUID

**Response:**
```json
{
  "success": true,
  "message": "Competitor deleted successfully"
}
```

**Test Command:**
```bash
curl -X DELETE "http://localhost:3001/api/competitors?id=uuid"
```

---

## Target Audiences

### GET /api/target-audiences
Get target audiences for a brand.

**Query Parameters:**
- `brand_id` - Brand UUID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "brand_id": "uuid",
      "name": "Tech Professionals",
      "demographics": {
        "age_range": "25-45",
        "gender": "all",
        "location": "urban",
        "income_level": "high"
      },
      "psychographics": {
        "interests": ["tech", "innovation"],
        "values": ["efficiency", "quality"],
        "lifestyle": "fast-paced"
      },
      "behaviors": ["online shoppers", "early adopters"],
      "pain_points": ["time constraints", "information overload"],
      "goals": ["efficiency", "productivity"]
    }
  ]
}
```

**Test Command:**
```bash
curl "http://localhost:3001/api/target-audiences?brand_id=uuid"
```

---

### POST /api/target-audiences
Create target audience.

**Request Body:**
```json
{
  "brand_id": "uuid",
  "name": "Tech Professionals",
  "demographics": {
    "age_range": "25-45",
    "gender": "all",
    "location": "urban",
    "income_level": "high"
  },
  "psychographics": {
    "interests": ["tech"],
    "values": ["efficiency"],
    "lifestyle": "fast-paced"
  },
  "behaviors": ["online shoppers"],
  "pain_points": ["time constraints"],
  "goals": ["efficiency"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    ...
  }
}
```

**Test Command:**
```bash
curl -X POST http://localhost:3001/api/target-audiences \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "uuid",
    "name": "Tech Professionals"
  }'
```

---

### PUT /api/target-audiences
Update target audience.

**Request Body:**
```json
{
  "id": "uuid",
  "name": "Updated Name",
  "demographics": {
    "age_range": "30-50"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    ...
  }
}
```

**Test Command:**
```bash
curl -X PUT http://localhost:3001/api/target-audiences \
  -H "Content-Type: application/json" \
  -d '{
    "id": "uuid",
    "name": "Updated Name"
  }'
```

---

### DELETE /api/target-audiences
Delete target audience.

**Query Parameters:**
- `id` - Audience UUID

**Response:**
```json
{
  "success": true,
  "message": "Target audience deleted successfully"
}
```

**Test Command:**
```bash
curl -X DELETE "http://localhost:3001/api/target-audiences?id=uuid"
```

---

## Campaigns

### GET /api/campaigns
Get campaigns for a brand.

**Query Parameters:**
- `brand_id` - Brand UUID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "brand_id": "uuid",
      "name": "Campaign Name",
      "objective": "awareness",
      "target_audience_id": "uuid",
      "budget": 10000,
      "start_date": "2025-11-01",
      "end_date": "2025-12-01",
      "platforms": ["facebook", "instagram"],
      "key_messages": ["message1"],
      "cta": "Shop Now",
      "status": "active"
    }
  ]
}
```

**Test Command:**
```bash
curl "http://localhost:3001/api/campaigns?brand_id=uuid"
```

---

### POST /api/campaigns
Create campaign.

**Request Body:**
```json
{
  "brand_id": "uuid",
  "name": "Campaign Name",
  "objective": "awareness",
  "target_audience_id": "uuid",
  "budget": 10000,
  "start_date": "2025-11-01",
  "end_date": "2025-12-01",
  "platforms": ["facebook", "instagram"],
  "key_messages": ["message1"],
  "cta": "Shop Now",
  "status": "active"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    ...
  }
}
```

**Test Command:**
```bash
curl -X POST http://localhost:3001/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "uuid",
    "name": "Campaign Name"
  }'
```

---

### PUT /api/campaigns
Update campaign.

**Request Body:**
```json
{
  "id": "uuid",
  "name": "Updated Name",
  "status": "paused"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    ...
  }
}
```

**Test Command:**
```bash
curl -X PUT http://localhost:3001/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "id": "uuid",
    "status": "paused"
  }'
```

---

### DELETE /api/campaigns
Delete campaign.

**Query Parameters:**
- `id` - Campaign UUID

**Response:**
```json
{
  "success": true,
  "message": "Campaign deleted successfully"
}
```

**Test Command:**
```bash
curl -X DELETE "http://localhost:3001/api/campaigns?id=uuid"
```

---

## Brand Intelligence

### GET /api/brand-intelligence
Get brand intelligence data.

**Query Parameters:**
- `brand_id` - Brand UUID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "brand_id": "uuid",
    "market_trends": ["trend1", "trend2"],
    "competitor_insights": {...},
    "audience_insights": {...},
    "recommendations": ["rec1", "rec2"],
    "opportunities": ["opp1"],
    "threats": ["threat1"],
    "last_updated": "2025-11-10T12:00:00.000Z"
  }
}
```

**Test Command:**
```bash
curl "http://localhost:3001/api/brand-intelligence?brand_id=uuid"
```

---

### POST /api/brand-intelligence
Save brand intelligence data.

**Request Body:**
```json
{
  "brand_id": "uuid",
  "market_trends": ["trend1"],
  "competitor_insights": {},
  "audience_insights": {},
  "recommendations": ["rec1"],
  "opportunities": ["opp1"],
  "threats": ["threat1"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    ...
  }
}
```

**Test Command:**
```bash
curl -X POST http://localhost:3001/api/brand-intelligence \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "uuid",
    "market_trends": []
  }'
```

---

## Brand Settings

### GET /api/brand-settings
Get brand settings.

**Query Parameters:**
- `brand_id` - Brand UUID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "brand_id": "uuid",
    "api_keys": {
      "claude": "sk-...",
      "openai": "sk-..."
    },
    "preferences": {
      "default_platform": "facebook",
      "auto_generate": true
    },
    "integrations": {
      "foreplay": { "enabled": true, "api_key": "..." }
    }
  }
}
```

**Test Command:**
```bash
curl "http://localhost:3001/api/brand-settings?brand_id=uuid"
```

---

### POST /api/brand-settings
Save brand settings.

**Request Body:**
```json
{
  "brand_id": "uuid",
  "api_keys": {
    "claude": "sk-...",
    "openai": "sk-..."
  },
  "preferences": {
    "default_platform": "facebook"
  },
  "integrations": {
    "foreplay": { "enabled": true }
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    ...
  }
}
```

**Test Command:**
```bash
curl -X POST http://localhost:3001/api/brand-settings \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "uuid",
    "preferences": {}
  }'
```

---

## Competitor Analyses

### GET /api/competitor-analyses
Get competitor analyses for a brand.

**Query Parameters:**
- `brand_id` - Brand UUID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "brand_id": "uuid",
      "competitor_id": "uuid",
      "analysis_type": "comprehensive",
      "findings": {...},
      "recommendations": ["rec1"],
      "date_range_start": "2025-01-01",
      "date_range_end": "2025-11-10"
    }
  ]
}
```

**Test Command:**
```bash
curl "http://localhost:3001/api/competitor-analyses?brand_id=uuid"
```

---

### GET /api/competitor-analyses/:id
Get specific competitor analysis.

**URL Parameters:**
- `id` - Analysis UUID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    ...
  }
}
```

**Test Command:**
```bash
curl http://localhost:3001/api/competitor-analyses/uuid
```

---

### POST /api/competitor-analyses
Create competitor analysis.

**Request Body:**
```json
{
  "brand_id": "uuid",
  "competitor_id": "uuid",
  "analysis_type": "comprehensive",
  "findings": {},
  "recommendations": ["rec1"],
  "date_range_start": "2025-01-01",
  "date_range_end": "2025-11-10"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    ...
  }
}
```

**Test Command:**
```bash
curl -X POST http://localhost:3001/api/competitor-analyses \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "uuid",
    "competitor_id": "uuid"
  }'
```

---

### DELETE /api/competitor-analyses/:id
Delete competitor analysis.

**URL Parameters:**
- `id` - Analysis UUID

**Response:**
```json
{
  "success": true,
  "message": "Competitor analysis deleted successfully"
}
```

**Test Command:**
```bash
curl -X DELETE http://localhost:3001/api/competitor-analyses/uuid
```

---

## Generated Creatives

### GET /api/generated-creatives
Get generated creatives for a campaign.

**Query Parameters:**
- `campaign_id` - Campaign UUID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "campaign_id": "uuid",
      "creative_type": "image",
      "platform": "facebook",
      "headline": "Creative headline",
      "body_text": "Body text",
      "cta": "Shop Now",
      "image_url": "https://...",
      "video_url": "https://...",
      "status": "generated",
      "performance_score": 0.85
    }
  ]
}
```

**Test Command:**
```bash
curl "http://localhost:3001/api/generated-creatives?campaign_id=uuid"
```

---

### POST /api/campaigns/:id/generate-creatives
Generate creatives for a campaign using AI.

**URL Parameters:**
- `id` - Campaign UUID

**Request Body:**
```json
{
  "count": 5,
  "creativeTypes": ["image", "video"],
  "platforms": ["facebook", "instagram"],
  "variations": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "job-uuid",
    "status": "processing",
    "estimated_time": 30
  }
}
```

**Test Command:**
```bash
curl -X POST http://localhost:3001/api/campaigns/uuid/generate-creatives \
  -H "Content-Type: application/json" \
  -d '{
    "count": 5,
    "creativeTypes": ["image"]
  }'
```

---

## AI Generation Endpoints

### POST /api/ai/generate-brand-intelligence
Generate brand intelligence using AI.

**Request Body:**
```json
{
  "brand_id": "uuid",
  "focus_areas": ["market_trends", "opportunities"],
  "include_competitors": true,
  "time_horizon": "quarterly"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "market_trends": [...],
    "competitor_insights": {...},
    "recommendations": [...],
    "opportunities": [...],
    "threats": [...]
  }
}
```

**Test Command:**
```bash
curl -X POST http://localhost:3001/api/ai/generate-brand-intelligence \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "uuid",
    "focus_areas": ["market_trends"]
  }'
```

---

### POST /api/ai/generate-audiences
Generate target audiences using AI.

**Request Body:**
```json
{
  "brand_id": "uuid",
  "product_id": "uuid",
  "count": 3,
  "depth": "detailed"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "audiences": [
      {
        "name": "Tech Professionals",
        "demographics": {...},
        "psychographics": {...},
        "behaviors": [...],
        "pain_points": [...],
        "goals": [...]
      }
    ]
  }
}
```

**Test Command:**
```bash
curl -X POST http://localhost:3001/api/ai/generate-audiences \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "uuid",
    "count": 3
  }'
```

---

### POST /api/ai/analyze-competitor
Analyze a competitor using AI.

**Request Body:**
```json
{
  "brand_id": "uuid",
  "competitor_id": "uuid",
  "analysis_depth": "comprehensive",
  "focus_areas": ["strengths", "weaknesses", "opportunities"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "strengths": [...],
    "weaknesses": [...],
    "opportunities": [...],
    "threats": [...],
    "recommendations": [...]
  }
}
```

**Test Command:**
```bash
curl -X POST http://localhost:3001/api/ai/analyze-competitor \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "uuid",
    "competitor_id": "uuid"
  }'
```

---

### POST /api/ai/generate-products
Generate product/service ideas using AI.

**Request Body:**
```json
{
  "brand_id": "uuid",
  "count": 5,
  "category": "saas",
  "target_audience_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "name": "Product Name",
        "type": "product",
        "description": "...",
        "features": [...],
        "pricing_model": "subscription",
        "target_audience": "...",
        "key_benefits": [...]
      }
    ]
  }
}
```

**Test Command:**
```bash
curl -X POST http://localhost:3001/api/ai/generate-products \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "uuid",
    "count": 5
  }'
```

---

### POST /api/ai/generate-campaigns
Generate campaign ideas using AI.

**Request Body:**
```json
{
  "brand_id": "uuid",
  "product_id": "uuid",
  "target_audience_id": "uuid",
  "count": 3,
  "budget_range": {
    "min": 5000,
    "max": 20000
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "campaigns": [
      {
        "name": "Campaign Name",
        "objective": "awareness",
        "budget": 10000,
        "platforms": ["facebook"],
        "key_messages": [...],
        "cta": "Shop Now"
      }
    ]
  }
}
```

**Test Command:**
```bash
curl -X POST http://localhost:3001/api/ai/generate-campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "uuid",
    "count": 3
  }'
```

---

### POST /api/ai/generate-ad-copy
Generate ad copy variations using AI.

**Request Body:**
```json
{
  "campaign_id": "uuid",
  "product_id": "uuid",
  "target_audience_id": "uuid",
  "platform": "facebook",
  "ad_type": "image",
  "count": 10,
  "tone": "professional",
  "include_emojis": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "variants": [
      {
        "headline": "Headline text",
        "body_text": "Body text",
        "cta": "Shop Now",
        "tone": "professional",
        "character_counts": {
          "headline": 25,
          "body": 100
        }
      }
    ]
  }
}
```

**Test Command:**
```bash
curl -X POST http://localhost:3001/api/ai/generate-ad-copy \
  -H "Content-Type: application/json" \
  -d '{
    "campaign_id": "uuid",
    "platform": "facebook",
    "count": 10
  }'
```

---

### POST /api/ai
Generic AI endpoint (for chat/completions).

**Request Body:**
```json
{
  "prompt": "Generate a brand story for a tech company",
  "model": "claude-3-opus-20240229",
  "max_tokens": 1000,
  "temperature": 0.7
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "Generated text...",
    "usage": {
      "prompt_tokens": 50,
      "completion_tokens": 500,
      "total_tokens": 550
    }
  }
}
```

**Test Command:**
```bash
curl -X POST http://localhost:3001/api/ai \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Generate a brand story",
    "model": "claude-3-opus-20240229"
  }'
```

---

## Admin Endpoints

### POST /api/admin/run-migrations
Run database migrations (admin only).

**Request Body:**
```json
{
  "migration": "add_new_table",
  "dry_run": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Migration completed successfully",
  "changes": [
    "Created table: new_table",
    "Added column: new_column"
  ]
}
```

**Test Command:**
```bash
curl -X POST http://localhost:3001/api/admin/run-migrations \
  -H "Content-Type: application/json" \
  -d '{
    "migration": "add_new_table"
  }'
```

---

## Frontend Service Methods

All frontend API calls go through `src/services/api/brandService.ts`. Here are the key methods:

### Brand Methods
- `getBrandAssets(brandId: string)` - Get brand assets from database
- `saveEditedBrandData(editedData: EditedBrandData)` - Save edited brand data to localStorage
- `loadEditedBrandData()` - Load edited brand data from localStorage

### Brand Profile Methods
- `getBrandProfile(brandId: string)` - Get brand profile
- `updateBrandProfile(brandId: string, updates: Partial<BrandProfile>)` - Update brand profile fields
- `generateBrandProfile(brandId: string, domain: string, options)` - Start async brand profile generation

### Health Check Methods
- `checkExternalApiHealth()` - Check if external API is available

---

## Testing Checklist

### CRUD Operations
- [ ] GET all records
- [ ] GET single record by ID
- [ ] POST create new record
- [ ] PUT update existing record
- [ ] DELETE remove record

### Edge Cases
- [ ] Missing required fields
- [ ] Invalid UUIDs
- [ ] Duplicate entries
- [ ] Large payloads
- [ ] Special characters in text fields
- [ ] Empty arrays/objects

### Error Scenarios
- [ ] 400 Bad Request (missing params)
- [ ] 404 Not Found (invalid ID)
- [ ] 500 Internal Server Error (database errors)
- [ ] Network timeouts
- [ ] Invalid JSON

### Performance
- [ ] Response times under load
- [ ] Concurrent requests
- [ ] Large dataset queries
- [ ] Pagination performance

### Integration
- [ ] Brand Profiler Worker integration
- [ ] Foreplay API integration
- [ ] Claude AI integration
- [ ] Database transactions

---

## Example Test Suite (Jest)

```javascript
describe('Brand Profile API', () => {
  let brandId;
  let profileId;

  beforeAll(async () => {
    // Create test brand
    const response = await fetch('http://localhost:3001/api/brands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Brand',
        website: 'https://test.com'
      })
    });
    const data = await response.json();
    brandId = data.data.id;
  });

  afterAll(async () => {
    // Cleanup test brand
    await fetch(`http://localhost:3001/api/brands?id=${brandId}`, {
      method: 'DELETE'
    });
  });

  test('GET /api/brand-profile - should return profile', async () => {
    const response = await fetch(
      `http://localhost:3001/api/brand-profile?brand_id=${brandId}`
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  test('PUT /api/brand-profile - should update profile', async () => {
    const response = await fetch('http://localhost:3001/api/brand-profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brand_id: brandId,
        brand_name: 'Updated Brand Name',
        tagline: 'New tagline'
      })
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.brand_name).toBe('Updated Brand Name');
  });

  test('POST /api/generate-brand-profile - should start job', async () => {
    const response = await fetch(
      'http://localhost:3001/api/generate-brand-profile',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_id: brandId,
          domain: 'test.com',
          includeReviews: false,
          maxPages: 5
        })
      }
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.jobId).toBeDefined();
  });
});
```

---

## Environment Variables

Required for testing:

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# External APIs
BRAND_EXTRACTOR_API=https://gtm.edwinlovett.com/api/extract-brand
BRAND_PROFILER_API=https://brand-profiler.edwin-6f1.workers.dev

# AI APIs
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Foreplay
FOREPLAY_API_KEY=...

# Server
PORT=3001
NODE_ENV=test
```

---

## Notes

1. All endpoints expect JSON payloads
2. UUIDs are required for all ID fields
3. Timestamps are in ISO 8601 format
4. All responses follow the `{ success: boolean, data?: any, error?: string }` pattern
5. Async operations (brand profile generation) use job polling pattern
6. Rate limiting may apply to external API calls
7. Some endpoints require brand_id for data isolation
8. All DELETE operations are hard deletes (no soft delete)

---

**Last Updated:** 2025-11-10
**Version:** 1.0.0
