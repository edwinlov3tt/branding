# Image & Content Scraper API Documentation

A Cloudflare Worker API that extracts images and content from web pages with automatic anti-bot protection bypass.

## Base URL

```
https://brand-services.edwin-6f1.workers.dev
```

## Endpoints

### GET Request

Extract images and content from a single URL.

**Endpoint**: `GET /`

**Query Parameters**:

| Parameter | Type | Default | Range | Description |
|-----------|------|---------|-------|-------------|
| `url` | string | *required* | - | The target URL to scrape |
| `limit` | number | `4` | 1-50 | Maximum number of images to return |
| `types` | string | `"img,og,icon,css,source"` | - | Comma-separated image source types |
| `includeContent` | boolean | `true` | - | Whether to extract page content |
| `maxContentLength` | number | `50000` | 1000-200000 | Maximum content length in bytes |

**Example**:
```bash
curl "https://brand-services.edwin-6f1.workers.dev?url=https://example.com&limit=10&includeContent=true&maxContentLength=5000"
```

---

### POST Request

Extract images and content from multiple URLs with bulk processing.

**Endpoint**: `POST /`

**Content-Type**: `application/json`

**Request Body Format 1** (Global Settings):
```json
{
  "urls": ["https://example.com", "https://another.com"],
  "limit": 4,
  "types": "img,og,icon,css,source",
  "includeContent": true,
  "maxContentLength": 50000,
  "concurrency": 4
}
```

**Request Body Format 2** (Per-URL Settings):
```json
{
  "urls": [
    {
      "url": "https://example.com",
      "limit": 10,
      "types": "img,og",
      "includeContent": true,
      "maxContentLength": 30000
    },
    {
      "url": "https://another.com",
      "limit": 5,
      "types": "img,og,icon",
      "includeContent": false
    }
  ],
  "concurrency": 4
}
```

**Body Parameters**:

| Parameter | Type | Default | Range | Description |
|-----------|------|---------|-------|-------------|
| `urls` | array | *required* | - | Array of URLs (strings) or URL objects |
| `limit` | number | `4` | 1-50 | Global limit for all URLs |
| `types` | string | `"img,og,icon,css,source"` | - | Global image source types |
| `includeContent` | boolean | `true` | - | Global content extraction flag |
| `maxContentLength` | number | `50000` | 1000-200000 | Global max content length |
| `concurrency` | number | `4` | 1-10 | Number of concurrent scrape operations |

**Example**:
```bash
curl -X POST https://brand-services.edwin-6f1.workers.dev \
  -H "Content-Type: application/json" \
  -d '{
    "urls": ["https://example.com"],
    "limit": 10,
    "includeContent": true,
    "maxContentLength": 5000
  }'
```

---

## Image Source Types

Specify which image sources to extract using the `types` parameter:

| Type | Description |
|------|-------------|
| `img` | Standard `<img>` tags with `src` and `srcset` attributes |
| `og` | Open Graph meta tags (`og:image`, `twitter:image`) |
| `icon` | Favicons and app icons (`apple-touch-icon`, etc.) |
| `css` | Background images from CSS `url()` and inline styles |
| `source` | `<picture><source>` elements with `srcset` |

**Default**: All types enabled (`"img,og,icon,css,source"`)

**Examples**:
- `types=img,og` - Only standard images and Open Graph images
- `types=icon` - Only favicons
- `types=img,og,icon,css,source` - All image sources (default)

---

## Response Format

### Success Response

```json
{
  "results": [
    {
      "url": "https://example.com",
      "found": true,
      "images": [
        "https://example.com/image1.jpg",
        "https://example.com/image2.png",
        "https://example.com/logo.svg"
      ],
      "sources": {
        "og": [
          "https://example.com/og-image.jpg"
        ],
        "img": [
          "https://example.com/image1.jpg",
          "https://example.com/image2.png"
        ],
        "source": [],
        "icon": [
          "https://example.com/favicon.png",
          "https://example.com/apple-touch-icon.png"
        ],
        "css": [
          "https://example.com/background.jpg"
        ]
      },
      "content": {
        "title": "Example Domain",
        "description": "Example website for demonstration purposes",
        "text": "This domain is for use in illustrative examples in documents. You may use this domain in literature without prior coordination or asking for permission.",
        "truncated": false
      },
      "scrapeMethod": "direct",
      "antiBot": false,
      "errors": []
    }
  ]
}
```

### Response Fields

#### Root Level

| Field | Type | Description |
|-------|------|-------------|
| `results` | array | Array of scrape results (one per URL) |

#### Result Object

| Field | Type | Description |
|-------|------|-------------|
| `url` | string | The URL that was scraped |
| `found` | boolean | Whether any images were found |
| `images` | array[string] | Deduplicated list of image URLs (up to `limit`) |
| `sources` | object | Images grouped by source type |
| `content` | object \| null | Extracted page content (null if `includeContent=false`) |
| `scrapeMethod` | string | `"direct"` or `"scrapfly"` |
| `antiBot` | boolean | Whether anti-bot protection was detected |
| `errors` | array[string] | Any errors encountered during scraping |

#### Sources Object

| Field | Type | Description |
|-------|------|-------------|
| `og` | array[string] | Images from Open Graph meta tags |
| `img` | array[string] | Images from `<img>` tags |
| `source` | array[string] | Images from `<picture><source>` elements |
| `icon` | array[string] | Favicons and app icons |
| `css` | array[string] | Images from CSS backgrounds |

#### Content Object

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Page title from `<title>` tag |
| `description` | string | Meta description content |
| `text` | string | Extracted and cleaned text content |
| `truncated` | boolean | Whether content was truncated at `maxContentLength` |

---

## Scrape Methods

### Direct Scraping (`"direct"`)

The worker fetches and parses the URL directly using Cloudflare's edge network.

**Advantages**:
- Faster response times
- Lower cost (no third-party API)
- Cloudflare caching (30-minute TTL)

### Scrapfly Fallback (`"scrapfly"`)

Automatically triggered when anti-bot protection is detected.

**Triggers**:
- HTTP status codes: 403, 429, 503
- Anti-bot headers detected
- Challenge page signatures (Cloudflare, Imperva, PerimeterX, etc.)
- Minimal content (< 500 bytes)

**Advantages**:
- Bypasses anti-bot protection
- Access to protected content
- Same response format

**Requirements**:
- `SCRAPFLY_API_KEY` environment variable must be configured
- Scrapfly account with available credits

---

## Error Responses

### Missing URL Parameter

**Status**: `400 Bad Request`

```json
{
  "error": "Missing ?url="
}
```

### Invalid Request Body

**Status**: `400 Bad Request`

```json
{
  "error": "Body must include { urls: [...] }"
}
```

### Anti-Bot Without Scrapfly Key

**Status**: `200 OK` (partial success)

```json
{
  "results": [
    {
      "url": "https://protected-site.com",
      "found": false,
      "images": [],
      "sources": { "og": [], "img": [], "source": [], "icon": [], "css": [] },
      "content": null,
      "scrapeMethod": "direct",
      "antiBot": true,
      "errors": [
        "Anti-bot protection detected, but no Scrapfly API key configured"
      ]
    }
  ]
}
```

### Fetch Failed

**Status**: `200 OK` (partial success)

```json
{
  "results": [
    {
      "url": "https://invalid-url.com",
      "found": false,
      "images": [],
      "sources": { "og": [], "img": [], "source": [], "icon": [], "css": [] },
      "content": null,
      "scrapeMethod": "direct",
      "antiBot": false,
      "errors": [
        "Fetch failed: getaddrinfo ENOTFOUND invalid-url.com"
      ]
    }
  ]
}
```

### Server Error

**Status**: `500 Internal Server Error`

```json
{
  "error": "Unexpected error message"
}
```

---

## Examples

### Example 1: Simple Image Extraction

**Request**:
```bash
curl "https://brand-services.edwin-6f1.workers.dev?url=https://example.com&limit=5"
```

**Response**:
```json
{
  "results": [
    {
      "url": "https://example.com",
      "found": true,
      "images": [
        "https://example.com/image1.jpg",
        "https://example.com/image2.png"
      ],
      "sources": {
        "og": [],
        "img": [
          "https://example.com/image1.jpg",
          "https://example.com/image2.png"
        ],
        "source": [],
        "icon": [
          "https://example.com/favicon.ico"
        ],
        "css": []
      },
      "content": {
        "title": "Example Domain",
        "description": "",
        "text": "Example content text...",
        "truncated": false
      },
      "scrapeMethod": "direct",
      "antiBot": false,
      "errors": []
    }
  ]
}
```

### Example 2: Content-Only Extraction

**Request**:
```bash
curl "https://brand-services.edwin-6f1.workers.dev?url=https://example.com&types=&includeContent=true&maxContentLength=10000"
```

**Response**:
```json
{
  "results": [
    {
      "url": "https://example.com",
      "found": false,
      "images": [],
      "sources": {
        "og": [],
        "img": [],
        "source": [],
        "icon": [],
        "css": []
      },
      "content": {
        "title": "Example Domain",
        "description": "Example website",
        "text": "This domain is for use in illustrative examples...",
        "truncated": false
      },
      "scrapeMethod": "direct",
      "antiBot": false,
      "errors": []
    }
  ]
}
```

### Example 3: Bulk URL Processing

**Request**:
```bash
curl -X POST https://brand-services.edwin-6f1.workers.dev \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://example.com",
      "https://another-example.com"
    ],
    "limit": 10,
    "includeContent": true,
    "concurrency": 2
  }'
```

**Response**:
```json
{
  "results": [
    {
      "url": "https://example.com",
      "found": true,
      "images": ["..."],
      "sources": { "..." },
      "content": { "..." },
      "scrapeMethod": "direct",
      "antiBot": false,
      "errors": []
    },
    {
      "url": "https://another-example.com",
      "found": true,
      "images": ["..."],
      "sources": { "..." },
      "content": { "..." },
      "scrapeMethod": "direct",
      "antiBot": false,
      "errors": []
    }
  ]
}
```

### Example 4: Anti-Bot Protection Detected

**Request**:
```bash
curl "https://brand-services.edwin-6f1.workers.dev?url=https://protected-site.com&limit=10"
```

**Response** (with Scrapfly configured):
```json
{
  "results": [
    {
      "url": "https://protected-site.com",
      "found": true,
      "images": [
        "https://protected-site.com/image1.jpg"
      ],
      "sources": {
        "og": ["https://protected-site.com/og-image.jpg"],
        "img": ["https://protected-site.com/image1.jpg"],
        "source": [],
        "icon": ["https://protected-site.com/favicon.png"],
        "css": []
      },
      "content": {
        "title": "Protected Site",
        "description": "Site with anti-bot protection",
        "text": "Content successfully extracted via Scrapfly...",
        "truncated": false
      },
      "scrapeMethod": "scrapfly",
      "antiBot": true,
      "errors": []
    }
  ]
}
```

---

## Rate Limits & Best Practices

### Rate Limits

- **Concurrency**: Maximum 10 concurrent requests (configurable, default: 4)
- **Image Limit**: Maximum 50 images per URL (configurable, default: 4)
- **Content Limit**: Maximum 200,000 bytes per URL (configurable, default: 50,000)

### Best Practices

1. **Use appropriate limits**: Set `limit` based on your needs to reduce response size
2. **Filter image types**: Use `types` parameter to only extract needed image sources
3. **Control content size**: Set `maxContentLength` to prevent large responses
4. **Batch requests**: Use POST endpoint for multiple URLs instead of multiple GET requests
5. **Handle errors gracefully**: Check the `errors` array in each result
6. **Monitor scrapeMethod**: Track when Scrapfly fallback is used (costs apply)

---

## CORS Support

All endpoints support CORS with the following headers:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
Access-Control-Max-Age: 86400
```

OPTIONS requests are handled automatically for preflight checks.

---

## Technical Details

### Caching

- **Cloudflare Cache**: Enabled for direct requests (30-minute TTL)
- **Scrapfly Cache**: Managed by Scrapfly API

### User Agent

```
Mozilla/5.0 (compatible; ImageSampler/1.0; +https://workers.dev)
```

### Image Priority Order

When deduplicating images, the following priority is used:

1. Open Graph images (`og`)
2. Standard images (`img`)
3. Source elements (`source`)
4. Icons (`icon`)
5. CSS backgrounds (`css`)

### Content Extraction

Text is extracted from the following HTML elements:
- `<p>` - Paragraphs
- `<article>` - Article content
- `<section>` - Section content
- `<h1>` - `<h6>` - Headings
- `<li>` - List items

Content is automatically:
- Cleaned of `<script>` and `<style>` tags
- Stripped of HTML tags
- Whitespace collapsed
- Truncated at `maxContentLength` with `"..."` suffix

---

## Support

For issues or questions, refer to the [CLAUDE.md](./CLAUDE.md) documentation or check the worker deployment logs.
