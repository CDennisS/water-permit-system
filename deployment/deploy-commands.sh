#!/bin/bash
# Vercel deployment commands

echo "🚀 Starting Vercel deployment..."

# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login to Vercel (if not already logged in)
vercel login

# Deploy to production
vercel --prod

echo "✅ Deployment initiated!"
echo "📋 Next steps:"
echo "1. Set environment variables in Vercel dashboard"
echo "2. Wait for build to complete"
echo "3. Test the deployed application"
echo "4. Configure custom domain (optional)"
