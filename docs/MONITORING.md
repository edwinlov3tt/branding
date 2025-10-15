# System Monitoring & Testing

This document describes the monitoring and testing endpoints available for the branding platform.

## Status Dashboard

**URL:** https://branding.up.railway.app/status

A beautiful, real-time HTML dashboard that shows:

### Backend Server Status
- Environment (production/development)
- Port number
- Server uptime

### PostgreSQL Database
- Connection status
- Server timestamp
- Total number of brands in database

### External GTM Brand Extractor API
- API status (OK/Error)
- API version
- System uptime
- Operational mode (static/javascript)

### API Endpoints Table
Complete list of all available endpoints with:
- HTTP method (GET/POST/PUT/DELETE)
- Endpoint path
- Description
- Real-time status

### Features
- One-click refresh button to update all metrics
- Direct link to run full test suite
- Color-coded status badges (green=OK, red=Error)
- Responsive design for mobile/desktop
- Dark theme matching your brand

---

## Comprehensive Test Suite

**URL:** https://branding.up.railway.app/api/test-all

A JSON API endpoint that tests all critical system components and returns detailed results.

### Response Structure

```json
{
  "timestamp": "2025-10-15T01:40:04.249Z",
  "backend": {
    "health": { "status": "ok", "message": "..." },
    "database": { "status": "ok", "message": "...", "timestamp": "..." }
  },
  "externalServices": {
    "gtmApi": {
      "status": "ok",
      "message": "GTM API is operational",
      "version": "5.1-tech-stack-detection",
      "uptime": 395941.16485668
    }
  },
  "endpoints": [
    {
      "endpoint": "/api/brands",
      "method": "GET",
      "description": "List brands",
      "status": "ok",
      "responseTime": "N/A",
      "dataCount": 6
    },
    ...
  ]
}
```

### What It Tests

1. **Backend Health** - Verifies the Express server is running
2. **Database Connection** - Tests PostgreSQL connectivity and query execution
3. **GTM API** - Checks external brand extraction API health at `https://gtm.edwinlovett.com/api/health`
4. **All Core Endpoints** - Tests:
   - GET /api/brands
   - GET /api/target-audiences
   - GET /api/products-services
   - GET /api/campaigns
   - GET /api/competitor-analyses
   - GET /api/ad-inspirations

### Use Cases

- **CI/CD Integration** - Add to your deployment pipeline
- **Health Monitoring** - Use with monitoring services (DataDog, New Relic, etc.)
- **Debugging** - Quick system overview when troubleshooting
- **API Documentation** - Reference for available endpoints

---

## Health Check Endpoint

**URL:** https://branding.up.railway.app/health

Simple JSON endpoint for basic health checks:

```json
{
  "status": "ok",
  "message": "API server is running"
}
```

Use this for:
- Load balancer health checks
- Uptime monitoring (UptimeRobot, Pingdom, etc.)
- Quick connectivity tests

---

## Monitoring Best Practices

### 1. Regular Health Checks
Set up automated monitoring to call `/health` every 1-5 minutes.

### 2. Daily Full Tests
Run `/api/test-all` at least once daily to catch issues early.

### 3. Status Dashboard Review
Bookmark the `/status` dashboard and check it before major deployments.

### 4. Alert Integration
Use the JSON responses to trigger alerts when `status !== "ok"`

### Example Monitoring Script

```bash
#!/bin/bash
# monitor-branding.sh

ENDPOINT="https://branding.up.railway.app/api/test-all"
RESPONSE=$(curl -s "$ENDPOINT")
STATUS=$(echo "$RESPONSE" | jq -r '.backend.health.status')

if [ "$STATUS" != "ok" ]; then
  echo "⚠️  Backend health check failed!"
  echo "$RESPONSE" | jq
  exit 1
fi

echo "✅ All systems operational"
exit 0
```

---

## External Service Health

The GTM Brand Extractor API provides its own health endpoint:

**URL:** https://gtm.edwinlovett.com/api/health

Returns detailed system metrics including:
- API status
- Current timestamp
- System uptime
- Memory usage
- Operational mode
- Puppeteer availability
- API version
- Enabled features list

This is automatically checked by the `/status` dashboard and `/api/test-all` endpoint.

---

## Quick Reference

| Endpoint | Type | Purpose |
|----------|------|---------|
| `/health` | JSON | Simple health check |
| `/status` | HTML | Visual dashboard |
| `/api/test-all` | JSON | Comprehensive test suite |

---

## Support

If you encounter issues:
1. Check `/status` dashboard first
2. Run `/api/test-all` for detailed diagnostics
3. Check Railway logs: `railway logs`
4. Verify environment variables are set

Last updated: October 2025
