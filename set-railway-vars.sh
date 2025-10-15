#!/bin/bash
# Set Railway Environment Variables Script

echo "🔧 Setting Railway Environment Variables"
echo "========================================"
echo ""

# Check if Railway CLI is logged in
if ! railway whoami > /dev/null 2>&1; then
  echo "❌ Not logged in to Railway CLI"
  echo "Run: railway login"
  exit 1
fi

echo "Setting environment variables for branding service..."
echo ""

# Service ID for the web service
SERVICE_ID="42d4c529-1c9b-46ad-849b-90fc3586d3d4"

# Set NODE_ENV
echo "1. Setting NODE_ENV=production..."
railway variables --set NODE_ENV=production --service $SERVICE_ID

# Set DATABASE_URL (internal Railway connection)
echo "2. Setting DATABASE_URL..."
railway variables --set DATABASE_URL=postgresql://postgres:dzoNspvTbTYUPFvwkqkLaHpIPHNaBYqg@postgres.railway.internal:5432/railway --service $SERVICE_ID

# Prompt for API keys
echo ""
echo "3. Please provide your API keys:"
echo ""

read -p "Enter CLAUDE_API_KEY: " CLAUDE_KEY
if [ -n "$CLAUDE_KEY" ]; then
  railway variables --set CLAUDE_API_KEY="$CLAUDE_KEY" --service $SERVICE_ID
  echo "✅ CLAUDE_API_KEY set"
fi

read -p "Enter OPENAI_API_KEY: " OPENAI_KEY
if [ -n "$OPENAI_KEY" ]; then
  railway variables --set OPENAI_API_KEY="$OPENAI_KEY" --service $SERVICE_ID
  echo "✅ OPENAI_API_KEY set"
fi

read -p "Enter FOREPLAY_API_KEY (or press Enter to use existing): " FOREPLAY_KEY
if [ -n "$FOREPLAY_KEY" ]; then
  railway variables --set FOREPLAY_API_KEY="$FOREPLAY_KEY" --service $SERVICE_ID
  echo "✅ FOREPLAY_API_KEY set"
else
  # Use the one from .env.local
  railway variables --set FOREPLAY_API_KEY="2v3GHbzgnVooySAdxJkSbB88vuic_lbkS1laHLj-wEUBs0QrStDMAYkPMNRfSrl_UPs2-GIddJvRCvnbgAfYvw" --service $SERVICE_ID
  echo "✅ FOREPLAY_API_KEY set (using existing)"
fi

# Set FOREPLAY_API_URL
echo "4. Setting FOREPLAY_API_URL..."
railway variables --set FOREPLAY_API_URL="https://public.api.foreplay.co" --service $SERVICE_ID

echo ""
echo "✅ All environment variables set!"
echo ""
echo "Next steps:"
echo "1. Railway will automatically redeploy with new variables"
echo "2. Wait 1-2 minutes for deployment to complete"
echo "3. Test: https://branding.up.railway.app/health"
echo ""
