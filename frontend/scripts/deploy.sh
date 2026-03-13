#!/bin/bash
set -e

echo "🚀 Deploying to Vercel production..."
DEPLOY_URL=$(npx vercel --prod --yes 2>&1 | grep -oE 'https://frontend-[a-z0-9]+-buxiangshangban\.vercel\.app' | head -1)

if [ -z "$DEPLOY_URL" ]; then
  echo "⚠️  Could not extract deploy URL, trying alias with latest..."
  npx vercel --prod --yes
else
  echo "📎 Setting alias: quantarmy.vercel.app → $DEPLOY_URL"
  npx vercel alias set "$DEPLOY_URL" quantarmy.vercel.app
  echo "✅ Deployed & aliased!"
  echo "   Production: $DEPLOY_URL"
  echo "   Alias:      https://quantarmy.vercel.app"
fi
