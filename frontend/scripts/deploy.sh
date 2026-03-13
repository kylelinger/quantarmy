#!/bin/bash
set -e

echo "🚀 Deploying to Vercel production..."
OUTPUT=$(npx vercel --prod --yes 2>&1)
echo "$OUTPUT" | tail -5

# Extract deployment URL (matches quantarmy-xxx or frontend-xxx patterns)
DEPLOY_URL=$(echo "$OUTPUT" | grep -oE 'https://[a-z0-9-]+-buxiangshangban\.vercel\.app' | head -1)

if [ -n "$DEPLOY_URL" ]; then
  echo "📎 Setting alias: quantarmy.vercel.app → $DEPLOY_URL"
  npx vercel alias set "$DEPLOY_URL" quantarmy.vercel.app
  echo "✅ Deployed & aliased!"
  echo "   Production: $DEPLOY_URL"
  echo "   Alias:      https://quantarmy.vercel.app"
else
  echo "⚠️  Could not extract deploy URL from output. Set alias manually."
  echo "   Run: npx vercel alias set <deploy-url> quantarmy.vercel.app"
fi
