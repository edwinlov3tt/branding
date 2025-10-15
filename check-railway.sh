#!/bin/bash
# Railway Health Check Script

echo "🔍 Railway Deployment Health Check"
echo "===================================="
echo ""

# Test health endpoint
echo "1. Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" https://branding.up.railway.app/health)
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
BODY=$(echo "$HEALTH_RESPONSE" | head -n-1)

echo "HTTP Status: $HTTP_CODE"
echo "Response: $BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Backend is healthy!"
  echo ""

  # Test brands endpoint
  echo "2. Testing /api/brands endpoint..."
  BRANDS_RESPONSE=$(curl -s https://branding.up.railway.app/api/brands)
  echo "$BRANDS_RESPONSE" | head -c 200
  echo "..."
  echo ""
  echo "✅ Database connection working!"
  echo ""

  # Test brand extraction
  echo "3. Testing brand extraction..."
  EXTRACT_RESPONSE=$(curl -s -X POST https://branding.up.railway.app/api/extract-brand \
    -H "Content-Type: application/json" \
    -d '{"url":"https://stripe.com"}' \
    --max-time 30)

  if echo "$EXTRACT_RESPONSE" | grep -q "success"; then
    echo "✅ Brand extraction working!"
  else
    echo "⚠️  Brand extraction may have issues"
    echo "Response: $EXTRACT_RESPONSE" | head -c 200
  fi
  echo ""

  echo "🎉 All systems operational!"
  echo ""
  echo "Next step: Update Vercel frontend"
  echo "VITE_API_BASE_URL=https://branding.up.railway.app"

elif [ "$HTTP_CODE" = "502" ]; then
  echo "❌ 502 Bad Gateway - App is not running"
  echo ""
  echo "Troubleshooting steps:"
  echo "1. Check Railway Dashboard → branding service → Logs"
  echo "2. Look for error messages in the logs"
  echo "3. Verify environment variables are set:"
  echo "   - NODE_ENV=production"
  echo "   - DATABASE_URL=<should be auto-set>"
  echo "   - CLAUDE_API_KEY, OPENAI_API_KEY, FOREPLAY_API_KEY"
  echo "4. Check Railway → Deployments tab for build errors"
  echo "5. Try redeploying: Railway Dashboard → branding → ⋮ → Redeploy"

elif [ "$HTTP_CODE" = "000" ]; then
  echo "❌ Connection failed - Service might not be deployed"
  echo ""
  echo "Check:"
  echo "1. Railway Dashboard → branding service → Settings → Networking"
  echo "2. Verify domain is set to: branding.up.railway.app"
  echo "3. Check if deployment is complete"

else
  echo "⚠️  Unexpected response: HTTP $HTTP_CODE"
  echo "Response: $BODY"
fi

echo ""
