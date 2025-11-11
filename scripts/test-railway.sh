#!/bin/bash
# Test Railway Deployment

echo "🧪 Testing Railway Backend"
echo "=========================="
echo ""
echo "URL: https://branding.up.railway.app/health"
echo ""

while true; do
  response=$(curl -s https://branding.up.railway.app/health)

  if echo "$response" | grep -q '"status":"ok"'; then
    echo "✅ SUCCESS! Backend is running!"
    echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
    echo ""
    echo "🎉 Your backend is live at: https://branding.up.railway.app"
    echo ""
    echo "Next steps:"
    echo "1. Test API: curl https://branding.up.railway.app/api/brands"
    echo "2. Update Vercel VITE_API_BASE_URL to: https://branding.up.railway.app"
    exit 0
  elif echo "$response" | grep -q '"status":"error"'; then
    echo "⏳ Still deploying... (Railway is building)"
  else
    echo "⏳ Waiting for Railway deployment..."
  fi

  sleep 10
done
