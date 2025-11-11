# Brand Profiler - Updated Usage Guide

## API Endpoint
```
https://brand-profiler.edwin-6f1.workers.dev
```

---

## Updated Request Format

### POST /brand-profile - Start Brand Analysis

**New Request Structure** (with review IDs):

```bash
curl -X POST https://brand-profiler.edwin-6f1.workers.dev/brand-profile \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "nielsensremodelingtx.com",
    "includeReviews": true,
    "maxPages": 15,
    "reviewIds": {
      "googlePlaceId": "ChIJN1t_tDeuEmsRUsoyG83frY4",
      "facebookPageId": "100063543614476",
      "yelpBusinessId": "nielsen-remodeling-dallas"
    }
  }'
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domain` | string | Yes | Company domain to analyze |
| `includeReviews` | boolean | No | Whether to fetch reviews (default: true) |
| `maxPages` | number | No | Max pages to scrape (default: 20, max: 50) |
| `reviewIds` | object | No | Review platform IDs (see below) |

### Review IDs Object

**All fields are optional** - only provide the IDs you have:

```javascript
{
  "reviewIds": {
    "googlePlaceId": "ChIJN1t_tDeuEmsRUsoyG83frY4",  // Google Maps place_id
    "facebookPageId": "100063543614476",              // Facebook numeric page ID
    "yelpBusinessId": "nielsen-remodeling-dallas"     // Yelp business ID or URL slug
  }
}
```

**Important**:
- If a review ID is **not provided**, that platform will be **skipped** (no search attempt)
- You must obtain these IDs from your own systems/APIs before calling the brand profiler
- The worker will **not** search for businesses anymore

---

## How to Get Review IDs

### Google Place ID
- Use Google Places API: https://developers.google.com/maps/documentation/places/web-service/place-id
- Or extract from Google Maps URL
- Format: `ChIJ...` (alphanumeric string)

### Facebook Page ID
- Use Facebook Graph API
- Or extract from page source
- Format: Numeric ID like `100063543614476`

### Yelp Business ID
- Use Yelp Fusion API
- Or extract from Yelp URL (e.g., `/biz/nielsen-remodeling-dallas`)
- Format: Business slug or ID

---

## Example Requests

### 1. With All Review IDs
```bash
curl -X POST https://brand-profiler.edwin-6f1.workers.dev/brand-profile \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "example.com",
    "reviewIds": {
      "googlePlaceId": "ChIJN1t_tDeuEmsRUsoyG83frY4",
      "facebookPageId": "100063543614476",
      "yelpBusinessId": "example-business-dallas"
    }
  }'
```

**Response**:
```json
{
  "jobId": "abc123-xyz789",
  "status": "processing",
  "estimatedTime": 60,
  "statusUrl": "/brand-profile/abc123-xyz789"
}
```

### 2. Google Only
```bash
curl -X POST https://brand-profiler.edwin-6f1.workers.dev/brand-profile \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "example.com",
    "reviewIds": {
      "googlePlaceId": "ChIJN1t_tDeuEmsRUsoyG83frY4"
    }
  }'
```

### 3. No Reviews (Just Website Analysis)
```bash
curl -X POST https://brand-profiler.edwin-6f1.workers.dev/brand-profile \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "example.com",
    "includeReviews": false
  }'
```

### 4. Poll for Results
```bash
# Use the jobId from the previous response
curl https://brand-profiler.edwin-6f1.workers.dev/brand-profile/abc123-xyz789
```

---

## Response Format

### Processing Response
```json
{
  "jobId": "abc123-xyz789",
  "status": "processing",
  "domain": "example.com",
  "startedAt": "2025-10-10T03:00:00Z",
  "progress": {
    "discovery": true,
    "discoveryData": { "pagesFound": 15 },
    "scraping": false,
    "reviews": false,
    "synthesis": false
  }
}
```

### Completed Response
```json
{
  "jobId": "abc123-xyz789",
  "status": "completed",
  "domain": "example.com",
  "startedAt": "2025-10-10T03:00:00Z",
  "completedAt": "2025-10-10T03:01:15Z",
  "brandProfile": {
    "brand": {
      "name": "Example Company",
      "tagline": "Your trusted partner",
      "positioning": "Premium service provider",
      "valueProps": ["Fast service", "Quality work", "Fair pricing"]
    },
    "voice": {
      "personality": ["professional", "friendly", "reliable"],
      "toneSliders": {
        "formal": 60,
        "playful": 25,
        "premium": 70,
        "technical": 45,
        "energetic": 50
      },
      "lexicon": {
        "preferred": ["trusted", "quality", "professional"],
        "avoid": ["cheap", "basic", "generic"]
      }
    },
    "audience": {
      "primary": "Homeowners and small businesses",
      "needs": ["Reliable service", "Fair pricing", "Quality work"],
      "painPoints": ["Unreliable contractors", "Hidden fees"]
    },
    "writingGuide": {
      "sentenceLength": "medium",
      "paragraphStyle": "2-3 sentences, benefit-focused",
      "formatting": "Title Case headlines, bullets for lists",
      "avoid": ["No emojis", "Avoid superlatives"]
    }
  },
  "insights": {
    "pagesCrawled": 15,
    "reviewsAnalyzed": 245,
    "duration": "58.3s",
    "sources": {
      "google": 120,
      "yelp": 85,
      "facebook": 40
    }
  }
}
```

---

## What Changed

### Before (Old Behavior - Deprecated)
❌ Worker tried to **search** for business on each platform
❌ Often failed to find correct business
❌ Made extra API calls

### After (New Behavior - Current)
✅ You **provide exact IDs** from your systems
✅ Worker fetches reviews **directly** using those IDs
✅ More reliable, faster, no search errors

---

## Integration Example

### Python Example
```python
import requests
import time

# Step 1: Get review IDs from your systems
google_place_id = get_google_place_id("example.com")  # Your function
facebook_page_id = get_facebook_page_id("example.com")  # Your function
yelp_business_id = get_yelp_business_id("example.com")  # Your function

# Step 2: Start brand profiling
response = requests.post(
    "https://brand-profiler.edwin-6f1.workers.dev/brand-profile",
    json={
        "domain": "example.com",
        "includeReviews": True,
        "maxPages": 15,
        "reviewIds": {
            "googlePlaceId": google_place_id,
            "facebookPageId": facebook_page_id,
            "yelpBusinessId": yelp_business_id
        }
    }
)

job_id = response.json()["jobId"]

# Step 3: Poll for results
while True:
    status_response = requests.get(
        f"https://brand-profiler.edwin-6f1.workers.dev/brand-profile/{job_id}"
    )
    data = status_response.json()

    if data["status"] == "completed":
        brand_profile = data["brandProfile"]
        print(f"Analysis complete! Brand: {brand_profile['brand']['name']}")
        break
    elif data["status"] == "failed":
        print(f"Failed: {data['error']}")
        break

    time.sleep(10)  # Wait 10 seconds before checking again
```

### JavaScript Example
```javascript
// Step 1: Get review IDs
const reviewIds = {
  googlePlaceId: await getGooglePlaceId("example.com"),
  facebookPageId: await getFacebookPageId("example.com"),
  yelpBusinessId: await getYelpBusinessId("example.com")
};

// Step 2: Start brand profiling
const startResponse = await fetch("https://brand-profiler.edwin-6f1.workers.dev/brand-profile", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    domain: "example.com",
    includeReviews: true,
    maxPages: 15,
    reviewIds
  })
});

const { jobId } = await startResponse.json();

// Step 3: Poll for results
const pollForResults = async (jobId) => {
  while (true) {
    const statusResponse = await fetch(
      `https://brand-profiler.edwin-6f1.workers.dev/brand-profile/${jobId}`
    );
    const data = await statusResponse.json();

    if (data.status === "completed") {
      return data.brandProfile;
    } else if (data.status === "failed") {
      throw new Error(data.error);
    }

    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10s
  }
};

const brandProfile = await pollForResults(jobId);
console.log("Brand:", brandProfile.brand.name);
```

---

## API Keys Configured

Your worker has the following keys configured:

✅ **ANTHROPIC_API_KEY** - Claude AI for brand analysis
✅ **OPENAI_API_KEY** - GPT fallback
✅ **OUTSCRAPER_API_KEY** - Google + Yelp reviews
✅ **RAPIDAPI_KEY** - Facebook reviews
✅ **SCRAPFLY_API_KEY** - Anti-bot bypass

---

## Troubleshooting

### "No reviews found"
- Check that you're providing valid IDs
- Verify the IDs are correct for each platform
- Check worker logs: `wrangler tail --config wrangler-brand.toml`

### Review API errors
- Outscraper: Check your API quota at https://app.outscraper.com
- RapidAPI: Check your subscription at https://rapidapi.com/developer/billing

### Worker timeout
- Use the **async endpoint** (`/brand-profile`), not sync
- Poll every 10 seconds until complete
- Max processing time: ~60-80 seconds

---

## Summary

**New workflow**:
1. Get review IDs from your systems
2. Send to brand profiler with `reviewIds` object
3. Worker fetches reviews directly (no searching)
4. Poll for results
5. Receive complete brand profile with reviews

**Benefits**:
- ✅ More reliable review fetching
- ✅ No search failures
- ✅ Faster execution
- ✅ Full control over which platforms to use
