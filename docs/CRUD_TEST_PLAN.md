# Comprehensive CRUD API Test Plan

This document provides a complete test suite for all CRUD (Create, Read, Update, Delete) operations in the Branding API, excluding external API calls.

## Test Configuration

```javascript
const BASE_URL = 'http://localhost:3001';
const API_VERSION = '/api';

// Test data store - populated during test execution
let testData = {
  brandId: null,
  productId: null,
  audienceId: null,
  campaignId: null,
  competitorId: null,
  analysisId: null
};
```

## Test Execution Order

The tests must be executed in the following order to maintain data dependencies:

1. ✅ Create Brand
2. ✅ Update Brand
3. ✅ Create Product/Service
4. ✅ Update Product/Service
5. ✅ Delete Product/Service
6. ✅ Create Target Audience
7. ✅ Update Target Audience
8. ✅ Delete Target Audience
9. ✅ Create Campaign
10. ✅ Update Campaign
11. ✅ Delete Campaign
12. ✅ Create Competitor
13. ✅ Update Competitor
14. ✅ Delete Competitor
15. ✅ Create Competitor Analysis
16. ✅ Delete Competitor Analysis
17. ✅ Delete Brand (Final Cleanup)

---

## Test Cases

### TEST 1: Create Brand

**Endpoint:** `POST /api/brands`

**Purpose:** Create a new test brand to use throughout the test suite

**Request Body:**
```json
{
  "name": "Test Brand CRUD Suite",
  "website": "https://testbrand-crud.example.com",
  "logo_url": "https://via.placeholder.com/150/FF0000/FFFFFF?text=TB",
  "primary_color": "#FF0000",
  "industry": "Technology Testing",
  "favicon_url": "https://via.placeholder.com/32/FF0000/FFFFFF?text=T"
}
```

**Expected Response:**
- Status: `201 Created`
- Response body should contain:
  ```json
  {
    "success": true,
    "data": {
      "id": "<uuid>",
      "name": "Test Brand CRUD Suite",
      "website": "https://testbrand-crud.example.com",
      "slug": "test-brand-crud-suite",
      "short_id": "<5-char-nanoid>",
      "created_at": "<timestamp>",
      ...
    }
  }
  ```

**Validation:**
- ✅ Response status is 201
- ✅ `success` field is `true`
- ✅ `data.id` exists and is a valid UUID
- ✅ `data.slug` is properly generated from name
- ✅ `data.short_id` is a 5-character string
- ✅ All input fields are correctly saved

**Capture Variables:**
```javascript
testData.brandId = response.data.data.id;
testData.brandSlug = response.data.data.slug;
testData.brandShortId = response.data.data.short_id;
```

---

### TEST 2: Update Brand

**Endpoint:** `PUT /api/brands`

**Purpose:** Verify brand update functionality

**Request Body:**
```json
{
  "id": "<testData.brandId>",
  "name": "Test Brand CRUD Suite - Updated",
  "website": "https://testbrand-crud-updated.example.com",
  "logo_url": "https://via.placeholder.com/150/0000FF/FFFFFF?text=TB-Updated",
  "primary_color": "#0000FF"
}
```

**Expected Response:**
- Status: `200 OK`
- Response body should contain updated values

**Validation:**
- ✅ Response status is 200
- ✅ `success` field is `true`
- ✅ `data.name` equals "Test Brand CRUD Suite - Updated"
- ✅ `data.website` equals "https://testbrand-crud-updated.example.com"
- ✅ `data.primary_color` equals "#0000FF"
- ✅ `data.id` remains unchanged
- ✅ `updated_at` timestamp is newer than `created_at`

---

### TEST 3: Create Product/Service

**Endpoint:** `POST /api/products-services`

**Purpose:** Create a product/service for the test brand

**Request Body:**
```json
{
  "brand_id": "<testData.brandId>",
  "name": "Test Product Alpha",
  "category": "Software",
  "description": "A comprehensive testing product for CRUD operations",
  "price": "$99.99/month",
  "cturl": "https://testbrand-crud.example.com/product/alpha",
  "features": [
    "Feature 1: Comprehensive testing",
    "Feature 2: Easy integration",
    "Feature 3: 24/7 support"
  ],
  "offers": [
    {
      "offer_text": "50% off first month",
      "expiration_date": "2025-12-31"
    }
  ]
}
```

**Expected Response:**
- Status: `201 Created`
- Response body contains created product with offers

**Validation:**
- ✅ Response status is 201
- ✅ `success` field is `true`
- ✅ `data.id` exists and is a valid UUID
- ✅ `data.brand_id` matches `testData.brandId`
- ✅ `data.features` is a JSONB array with 3 items
- ✅ `data.offers` array contains 1 offer

**Capture Variables:**
```javascript
testData.productId = response.data.data.id;
```

---

### TEST 4: Update Product/Service

**Endpoint:** `PUT /api/products-services`

**Purpose:** Verify product/service update functionality

**Request Body:**
```json
{
  "id": "<testData.productId>",
  "name": "Test Product Alpha - Pro Edition",
  "description": "An enhanced testing product with premium features",
  "price": "$149.99/month",
  "features": [
    "Feature 1: Advanced testing",
    "Feature 2: Priority support",
    "Feature 3: API access",
    "Feature 4: Custom integrations"
  ],
  "offers": [
    {
      "offer_text": "30-day money-back guarantee",
      "expiration_date": null
    },
    {
      "offer_text": "Free trial for 14 days",
      "expiration_date": "2025-11-30"
    }
  ]
}
```

**Expected Response:**
- Status: `200 OK`
- Response body contains updated product

**Validation:**
- ✅ Response status is 200
- ✅ `data.name` equals "Test Product Alpha - Pro Edition"
- ✅ `data.price` equals "$149.99/month"
- ✅ `data.features` array has 4 items
- ✅ `data.offers` array has 2 items

---

### TEST 5: Delete Product/Service

**Endpoint:** `DELETE /api/products-services`

**Purpose:** Verify product/service deletion

**Request Body:**
```json
{
  "id": "<testData.productId>"
}
```

**Expected Response:**
- Status: `200 OK`
- Response body confirms deletion

**Validation:**
- ✅ Response status is 200
- ✅ `success` field is `true`
- ✅ `message` equals "Product/service deleted successfully"

**Verify Deletion:**
- GET `/api/products-services?brand_id=<testData.brandId>` should return empty array

---

### TEST 6: Create Target Audience

**Endpoint:** `POST /api/target-audiences`

**Purpose:** Create a target audience for the test brand

**Request Body:**
```json
{
  "brand_id": "<testData.brandId>",
  "name": "Tech-Savvy Millennials",
  "description": "Young professionals interested in cutting-edge technology",
  "age_range": "25-35",
  "gender": "All",
  "location": "Urban areas (US)",
  "income_level": "$60k-$120k",
  "education": "Bachelor's degree or higher",
  "occupation": "Software Engineers, Product Managers",
  "interests": [
    "Technology",
    "Innovation",
    "Productivity tools",
    "Career development"
  ],
  "values": [
    "Efficiency",
    "Innovation",
    "Work-life balance"
  ],
  "lifestyle": "Fast-paced, digitally connected, early adopters",
  "pain_points": [
    "Need for efficient workflow tools",
    "Keeping up with technology trends",
    "Managing multiple projects"
  ],
  "goals": [
    "Career advancement",
    "Improve productivity",
    "Stay ahead of technology curve"
  ],
  "buying_behavior": "Research extensively online, value peer reviews, prefer free trials",
  "budget_range": "$50-$200/month for SaaS tools",
  "channels": [
    "LinkedIn",
    "Twitter",
    "Tech blogs",
    "Product Hunt"
  ]
}
```

**Expected Response:**
- Status: `201 Created`
- Response body contains created audience (with camelCase transformation)

**Validation:**
- ✅ Response status is 201
- ✅ `success` field is `true`
- ✅ `data.id` exists and is a valid UUID
- ✅ `data.brand_id` matches `testData.brandId` (in DB, not response)
- ✅ Response uses camelCase format (`painPoints`, `budgetRange`, etc.)
- ✅ `data.demographics` contains formatted demographic info

**Capture Variables:**
```javascript
testData.audienceId = response.data.data.id;
```

---

### TEST 7: Update Target Audience

**Endpoint:** `PUT /api/target-audiences`

**Purpose:** Verify target audience update functionality

**Request Body:**
```json
{
  "id": "<testData.audienceId>",
  "name": "Tech-Savvy Millennials & Gen Z",
  "description": "Young professionals and digital natives interested in cutting-edge technology",
  "age_range": "22-38",
  "income_level": "$50k-$150k",
  "interests": [
    "Technology",
    "Innovation",
    "Productivity tools",
    "Career development",
    "AI and Machine Learning"
  ],
  "pain_points": [
    "Need for efficient workflow tools",
    "Keeping up with technology trends",
    "Managing multiple projects",
    "Information overload"
  ],
  "goals": [
    "Career advancement",
    "Improve productivity",
    "Stay ahead of technology curve",
    "Work-life integration"
  ],
  "channels": [
    "LinkedIn",
    "Twitter",
    "Tech blogs",
    "Product Hunt",
    "YouTube",
    "Reddit"
  ]
}
```

**Expected Response:**
- Status: `200 OK`
- Response body contains updated audience

**Validation:**
- ✅ Response status is 200
- ✅ `data.name` equals "Tech-Savvy Millennials & Gen Z"
- ✅ `data.interests` array has 5 items
- ✅ `data.painPoints` array has 4 items
- ✅ `data.channels` array has 6 items

---

### TEST 8: Delete Target Audience

**Endpoint:** `DELETE /api/target-audiences`

**Purpose:** Verify target audience deletion

**Request Body:**
```json
{
  "id": "<testData.audienceId>"
}
```

**Expected Response:**
- Status: `200 OK`
- Response body confirms deletion

**Validation:**
- ✅ Response status is 200
- ✅ `success` field is `true`
- ✅ `message` equals "Target audience deleted successfully"

---

### TEST 9: Create Campaign

**Endpoint:** `POST /api/campaigns`

**Purpose:** Create a marketing campaign for the test brand

**Request Body:**
```json
{
  "brand_id": "<testData.brandId>",
  "name": "Q4 Product Launch Campaign",
  "objective": "Product Launch",
  "marketing_objectives": [
    "Brand Awareness",
    "Lead Generation",
    "Product Adoption"
  ],
  "other_objective": "Drive beta signups",
  "target_audience_ids": [],
  "start_date": "2025-10-01",
  "end_date": "2025-12-31",
  "channels": [
    "Social Media",
    "Email Marketing",
    "Content Marketing",
    "Paid Advertising"
  ],
  "status": "planning"
}
```

**Expected Response:**
- Status: `201 Created`
- Response body contains created campaign

**Validation:**
- ✅ Response status is 201
- ✅ `success` field is `true`
- ✅ `data.id` exists and is a valid UUID
- ✅ `data.brand_id` matches `testData.brandId`
- ✅ `data.marketing_objectives` is a JSONB array with 3 items
- ✅ `data.channels` is a JSONB array with 4 items
- ✅ `data.status` equals "planning"

**Capture Variables:**
```javascript
testData.campaignId = response.data.data.id;
```

---

### TEST 10: Update Campaign

**Endpoint:** `PUT /api/campaigns`

**Purpose:** Verify campaign update functionality

**Request Body:**
```json
{
  "id": "<testData.campaignId>",
  "name": "Q4 Product Launch Campaign - Extended",
  "objective": "Product Launch & Growth",
  "marketing_objectives": [
    "Brand Awareness",
    "Lead Generation",
    "Product Adoption",
    "Customer Retention"
  ],
  "end_date": "2026-01-31",
  "channels": [
    "Social Media",
    "Email Marketing",
    "Content Marketing",
    "Paid Advertising",
    "Influencer Marketing",
    "Webinars"
  ],
  "status": "active"
}
```

**Expected Response:**
- Status: `200 OK`
- Response body contains updated campaign

**Validation:**
- ✅ Response status is 200
- ✅ `data.name` equals "Q4 Product Launch Campaign - Extended"
- ✅ `data.marketing_objectives` array has 4 items
- ✅ `data.channels` array has 6 items
- ✅ `data.status` equals "active"
- ✅ `data.end_date` equals "2026-01-31"

---

### TEST 11: Delete Campaign

**Endpoint:** `DELETE /api/campaigns`

**Purpose:** Verify campaign deletion

**Request Body:**
```json
{
  "id": "<testData.campaignId>"
}
```

**Expected Response:**
- Status: `200 OK`
- Response body confirms deletion

**Validation:**
- ✅ Response status is 200
- ✅ `success` field is `true`
- ✅ `message` equals "Campaign deleted successfully"

---

### TEST 12: Create Competitor

**Endpoint:** `POST /api/competitors`

**Purpose:** Create a competitor entry for the test brand

**Request Body:**
```json
{
  "brand_id": "<testData.brandId>",
  "name": "Competitor Alpha Inc",
  "description": "Leading competitor in the testing software space",
  "website": "https://competitor-alpha.example.com",
  "strengths": [
    "Strong brand recognition",
    "Large customer base",
    "Comprehensive feature set",
    "Enterprise-grade security"
  ],
  "weaknesses": [
    "Higher pricing",
    "Complex user interface",
    "Slower innovation cycle",
    "Limited customer support"
  ],
  "market_position": "Market Leader - 35% market share"
}
```

**Expected Response:**
- Status: `201 Created`
- Response body contains created competitor

**Validation:**
- ✅ Response status is 201
- ✅ `success` field is `true`
- ✅ `data.id` exists and is a valid UUID
- ✅ `data.brand_id` matches `testData.brandId`
- ✅ `data.strengths` is a JSONB array with 4 items
- ✅ `data.weaknesses` is a JSONB array with 4 items

**Capture Variables:**
```javascript
testData.competitorId = response.data.data.id;
```

---

### TEST 13: Update Competitor

**Endpoint:** `PUT /api/competitors`

**Purpose:** Verify competitor update functionality

**Request Body:**
```json
{
  "id": "<testData.competitorId>",
  "name": "Competitor Alpha Inc (Acquired)",
  "description": "Former leading competitor, recently acquired by larger corporation",
  "website": "https://competitor-alpha-new.example.com",
  "strengths": [
    "Strong brand recognition",
    "Large customer base",
    "Comprehensive feature set",
    "Enterprise-grade security",
    "Expanded resources from acquisition"
  ],
  "weaknesses": [
    "Higher pricing",
    "Complex user interface",
    "Organizational uncertainty post-acquisition",
    "Product roadmap unclear"
  ],
  "market_position": "Market Leader - 32% market share (declining)"
}
```

**Expected Response:**
- Status: `200 OK`
- Response body contains updated competitor

**Validation:**
- ✅ Response status is 200
- ✅ `data.name` equals "Competitor Alpha Inc (Acquired)"
- ✅ `data.strengths` array has 5 items
- ✅ `data.weaknesses` array has 4 items
- ✅ `data.market_position` updated correctly

---

### TEST 14: Delete Competitor

**Endpoint:** `DELETE /api/competitors`

**Purpose:** Verify competitor deletion

**Request Body:**
```json
{
  "id": "<testData.competitorId>"
}
```

**Expected Response:**
- Status: `200 OK`
- Response body confirms deletion

**Validation:**
- ✅ Response status is 200
- ✅ `success` field is `true`
- ✅ `message` equals "Competitor deleted successfully"

---

### TEST 15: Create Competitor Analysis

**Endpoint:** `POST /api/competitor-analyses`

**Purpose:** Create a competitor analysis for the test brand

**Request Body:**
```json
{
  "brand_id": "<testData.brandId>",
  "competitor_name": "Competitor Beta Solutions",
  "competitor_website": "https://competitor-beta.example.com",
  "facebook_page": "CompetitorBeta",
  "total_ads_analyzed": 45,
  "ad_ids": ["ad_001", "ad_002", "ad_003"],
  "ads_data": [
    {
      "id": "ad_001",
      "platform": "Facebook",
      "description": "Test ad copy",
      "cta": "Learn More"
    }
  ],
  "overview": "Competitor Beta is a mid-sized player focusing on small to medium businesses with aggressive pricing strategy.",
  "positioning": "Value-for-money provider targeting cost-conscious SMBs",
  "creative_strategy": {
    "ad_formats": ["Video", "Carousel", "Image"],
    "common_themes": ["Affordability", "Ease of use", "Quick setup"],
    "creative_patterns": ["Before/after comparisons", "Customer testimonials"],
    "frequency": "Daily posts"
  },
  "messaging_analysis": {
    "tone": "Friendly and approachable",
    "key_messages": [
      "Save money without compromising quality",
      "Setup in minutes",
      "No technical expertise required"
    ],
    "ctas": ["Start Free Trial", "Get Demo", "Contact Sales"],
    "value_propositions": [
      "50% cheaper than competitors",
      "Money-back guarantee",
      "24/7 customer support"
    ]
  },
  "visual_design_elements": {
    "colors": ["Blue", "Green", "White"],
    "imagery_style": "Clean, minimalist, professional",
    "typography": "Modern sans-serif fonts",
    "branding_consistency": "High - consistent across all ads"
  },
  "target_audience_insights": {
    "demographics": ["Small business owners", "Entrepreneurs", "Startups"],
    "psychographics": ["Budget-conscious", "Value seekers", "DIY mindset"],
    "pain_points": ["Limited budget", "Technical complexity", "Time constraints"]
  },
  "performance_indicators": {
    "engagement_patterns": "High engagement on video content",
    "ad_frequency": "3-5 ads per day",
    "timing": "Weekday mornings and evenings"
  },
  "key_findings": [
    "Heavy focus on pricing as primary differentiator",
    "Strong emphasis on ease of use",
    "Video content performs best",
    "Target audience highly engaged with testimonials"
  ],
  "recommendations": [
    "Emphasize premium features and ROI over price",
    "Create content highlighting advanced capabilities",
    "Develop case studies for enterprise customers",
    "Position as the professional choice vs budget option"
  ],
  "analysis_model": "manual-review",
  "analysis_confidence": 0.92,
  "analysis_start_date": "2025-09-01",
  "analysis_end_date": "2025-09-30"
}
```

**Expected Response:**
- Status: `201 Created`
- Response body contains created competitor analysis

**Validation:**
- ✅ Response status is 201
- ✅ `success` field is `true`
- ✅ `data.id` exists and is a valid UUID
- ✅ `data.brand_id` matches `testData.brandId`
- ✅ `data.total_ads_analyzed` equals 45
- ✅ All JSONB fields are properly stored
- ✅ `data.key_findings` array has 4 items
- ✅ `data.recommendations` array has 4 items

**Capture Variables:**
```javascript
testData.analysisId = response.data.data.id;
```

---

### TEST 16: Delete Competitor Analysis

**Endpoint:** `DELETE /api/competitor-analyses/:id`

**Purpose:** Verify competitor analysis deletion

**Request URL:**
```
DELETE /api/competitor-analyses/<testData.analysisId>
```

**Expected Response:**
- Status: `200 OK`
- Response body confirms deletion

**Validation:**
- ✅ Response status is 200
- ✅ `success` field is `true`
- ✅ `message` equals "Competitor analysis deleted successfully"

---

### TEST 17: Delete Brand (Final Cleanup)

**Endpoint:** `DELETE /api/brands`

**Purpose:** Delete the test brand and verify cascade deletion

**Request Query Parameters:**
```
?id=<testData.brandId>
```

**Expected Response:**
- Status: `200 OK`
- Response body confirms deletion

**Validation:**
- ✅ Response status is 200
- ✅ `success` field is `true`
- ✅ `message` equals "Brand deleted successfully"

**Cascade Verification:**
Verify that the following GET requests return empty or 404:
- GET `/api/products-services?brand_id=<testData.brandId>` → Empty array
- GET `/api/target-audiences?brand_id=<testData.brandId>` → Empty array
- GET `/api/campaigns?brand_id=<testData.brandId>` → Empty array
- GET `/api/competitors?brand_id=<testData.brandId>` → Empty array
- GET `/api/competitor-analyses?brand_id=<testData.brandId>` → Empty array

---

## Automated Test Script

Here's a JavaScript/Node.js script to execute all tests:

```javascript
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

const testData = {
  brandId: null,
  productId: null,
  audienceId: null,
  campaignId: null,
  competitorId: null,
  analysisId: null
};

async function runTests() {
  console.log('🧪 Starting Comprehensive CRUD Test Suite\n');

  try {
    // TEST 1: Create Brand
    console.log('TEST 1: Creating test brand...');
    const brandResponse = await axios.post(`${BASE_URL}/brands`, {
      name: "Test Brand CRUD Suite",
      website: "https://testbrand-crud.example.com",
      logo_url: "https://via.placeholder.com/150/FF0000/FFFFFF?text=TB",
      primary_color: "#FF0000",
      industry: "Technology Testing",
      favicon_url: "https://via.placeholder.com/32/FF0000/FFFFFF?text=T"
    });
    testData.brandId = brandResponse.data.data.id;
    console.log(`✅ Brand created with ID: ${testData.brandId}\n`);

    // TEST 2: Update Brand
    console.log('TEST 2: Updating brand...');
    await axios.put(`${BASE_URL}/brands`, {
      id: testData.brandId,
      name: "Test Brand CRUD Suite - Updated",
      website: "https://testbrand-crud-updated.example.com",
      primary_color: "#0000FF"
    });
    console.log('✅ Brand updated successfully\n');

    // TEST 3: Create Product
    console.log('TEST 3: Creating product...');
    const productResponse = await axios.post(`${BASE_URL}/products-services`, {
      brand_id: testData.brandId,
      name: "Test Product Alpha",
      category: "Software",
      description: "A comprehensive testing product",
      price: "$99.99/month",
      features: ["Feature 1", "Feature 2", "Feature 3"]
    });
    testData.productId = productResponse.data.data.id;
    console.log(`✅ Product created with ID: ${testData.productId}\n`);

    // TEST 4: Update Product
    console.log('TEST 4: Updating product...');
    await axios.put(`${BASE_URL}/products-services`, {
      id: testData.productId,
      name: "Test Product Alpha - Pro Edition",
      price: "$149.99/month",
      features: ["Feature 1", "Feature 2", "Feature 3", "Feature 4"]
    });
    console.log('✅ Product updated successfully\n');

    // TEST 5: Delete Product
    console.log('TEST 5: Deleting product...');
    await axios.delete(`${BASE_URL}/products-services`, {
      data: { id: testData.productId }
    });
    console.log('✅ Product deleted successfully\n');

    // TEST 6: Create Target Audience
    console.log('TEST 6: Creating target audience...');
    const audienceResponse = await axios.post(`${BASE_URL}/target-audiences`, {
      brand_id: testData.brandId,
      name: "Tech-Savvy Millennials",
      description: "Young professionals interested in technology",
      age_range: "25-35",
      gender: "All",
      location: "Urban areas (US)",
      interests: ["Technology", "Innovation"],
      pain_points: ["Efficiency", "Productivity"],
      goals: ["Career advancement"]
    });
    testData.audienceId = audienceResponse.data.data.id;
    console.log(`✅ Target audience created with ID: ${testData.audienceId}\n`);

    // TEST 7: Update Target Audience
    console.log('TEST 7: Updating target audience...');
    await axios.put(`${BASE_URL}/target-audiences`, {
      id: testData.audienceId,
      name: "Tech-Savvy Millennials & Gen Z",
      age_range: "22-38",
      interests: ["Technology", "Innovation", "AI"]
    });
    console.log('✅ Target audience updated successfully\n');

    // TEST 8: Delete Target Audience
    console.log('TEST 8: Deleting target audience...');
    await axios.delete(`${BASE_URL}/target-audiences`, {
      data: { id: testData.audienceId }
    });
    console.log('✅ Target audience deleted successfully\n');

    // TEST 9: Create Campaign
    console.log('TEST 9: Creating campaign...');
    const campaignResponse = await axios.post(`${BASE_URL}/campaigns`, {
      brand_id: testData.brandId,
      name: "Q4 Product Launch Campaign",
      objective: "Product Launch",
      marketing_objectives: ["Brand Awareness", "Lead Generation"],
      start_date: "2025-10-01",
      end_date: "2025-12-31",
      channels: ["Social Media", "Email Marketing"],
      status: "planning"
    });
    testData.campaignId = campaignResponse.data.data.id;
    console.log(`✅ Campaign created with ID: ${testData.campaignId}\n`);

    // TEST 10: Update Campaign
    console.log('TEST 10: Updating campaign...');
    await axios.put(`${BASE_URL}/campaigns`, {
      id: testData.campaignId,
      name: "Q4 Product Launch Campaign - Extended",
      status: "active",
      channels: ["Social Media", "Email Marketing", "Paid Advertising"]
    });
    console.log('✅ Campaign updated successfully\n');

    // TEST 11: Delete Campaign
    console.log('TEST 11: Deleting campaign...');
    await axios.delete(`${BASE_URL}/campaigns`, {
      data: { id: testData.campaignId }
    });
    console.log('✅ Campaign deleted successfully\n');

    // TEST 12: Create Competitor
    console.log('TEST 12: Creating competitor...');
    const competitorResponse = await axios.post(`${BASE_URL}/competitors`, {
      brand_id: testData.brandId,
      name: "Competitor Alpha Inc",
      description: "Leading competitor",
      website: "https://competitor-alpha.example.com",
      strengths: ["Strong brand", "Large customer base"],
      weaknesses: ["Higher pricing", "Complex UI"]
    });
    testData.competitorId = competitorResponse.data.data.id;
    console.log(`✅ Competitor created with ID: ${testData.competitorId}\n`);

    // TEST 13: Update Competitor
    console.log('TEST 13: Updating competitor...');
    await axios.put(`${BASE_URL}/competitors`, {
      id: testData.competitorId,
      name: "Competitor Alpha Inc (Acquired)",
      strengths: ["Strong brand", "Large customer base", "Expanded resources"]
    });
    console.log('✅ Competitor updated successfully\n');

    // TEST 14: Delete Competitor
    console.log('TEST 14: Deleting competitor...');
    await axios.delete(`${BASE_URL}/competitors`, {
      data: { id: testData.competitorId }
    });
    console.log('✅ Competitor deleted successfully\n');

    // TEST 15: Create Competitor Analysis
    console.log('TEST 15: Creating competitor analysis...');
    const analysisResponse = await axios.post(`${BASE_URL}/competitor-analyses`, {
      brand_id: testData.brandId,
      competitor_name: "Competitor Beta Solutions",
      overview: "Mid-sized player focusing on SMBs",
      positioning: "Value-for-money provider",
      total_ads_analyzed: 45,
      key_findings: ["Focus on pricing", "Ease of use emphasis"],
      recommendations: ["Emphasize premium features", "Highlight ROI"]
    });
    testData.analysisId = analysisResponse.data.data.id;
    console.log(`✅ Competitor analysis created with ID: ${testData.analysisId}\n`);

    // TEST 16: Delete Competitor Analysis
    console.log('TEST 16: Deleting competitor analysis...');
    await axios.delete(`${BASE_URL}/competitor-analyses/${testData.analysisId}`);
    console.log('✅ Competitor analysis deleted successfully\n');

    // TEST 17: Delete Brand
    console.log('TEST 17: Deleting test brand (final cleanup)...');
    await axios.delete(`${BASE_URL}/brands?id=${testData.brandId}`);
    console.log('✅ Brand deleted successfully\n');

    console.log('🎉 All tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.error('Test data at failure:', testData);
  }
}

// Run the test suite
runTests();
```

## Running the Tests

### Option 1: Manual Testing (Using API Testing Tool)

1. Import this document into Postman, Insomnia, or similar
2. Set the base URL to `http://localhost:3001`
3. Execute each test in order
4. Manually verify responses match expected results

### Option 2: Automated Testing (Node.js Script)

1. Save the automated script above as `run-crud-tests.js`
2. Install dependencies:
   ```bash
   npm install axios
   ```
3. Ensure your API server is running:
   ```bash
   node server.js
   ```
4. Run the test suite:
   ```bash
   node run-crud-tests.js
   ```

### Option 3: Using cURL

Execute each test using cURL commands in sequence. Example for TEST 1:

```bash
curl -X POST http://localhost:3001/api/brands \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Brand CRUD Suite",
    "website": "https://testbrand-crud.example.com",
    "logo_url": "https://via.placeholder.com/150/FF0000/FFFFFF?text=TB",
    "primary_color": "#FF0000",
    "industry": "Technology Testing"
  }'
```

## Success Criteria

The test suite is considered successful when:

- ✅ All 17 tests execute without errors
- ✅ All HTTP status codes match expected values
- ✅ All data is correctly created, updated, and deleted
- ✅ JSONB fields are properly stored and retrieved
- ✅ Cascade deletion works correctly (brand deletion removes all related data)
- ✅ No orphaned records remain after test completion

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify PostgreSQL is running
   - Check environment variables in `.env.local`

2. **404 Errors**
   - Ensure server is running on port 3001
   - Verify endpoint URLs match server.js definitions

3. **UUID Validation Errors**
   - Ensure you're using captured IDs from previous tests
   - Check that IDs are valid UUIDs

4. **JSONB Type Errors**
   - Verify arrays are passed as actual arrays, not strings
   - Ensure JSON is valid

## Notes

- Tests must be run in the specified order due to data dependencies
- Each test assumes the previous tests have completed successfully
- The final brand deletion (TEST 17) should cascade delete any remaining related data
- All external API calls (Foreplay, Claude, GTM API) are excluded as requested
- DELETE endpoints use different parameter methods:
  - Most use request body: `{ id: "uuid" }`
  - Brands use query parameter: `?id=uuid`
  - Competitor analyses use path parameter: `/:id`
