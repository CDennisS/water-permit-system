#!/bin/bash
echo "🚀 IMMEDIATE DEPLOYMENT STARTING..."
echo "📦 Deploying UMSCC Permit Management System"
echo "⏰ Estimated time: 3-5 minutes"

# Check if we're in the right directory
if [ ! -f "app.py" ]; then
    echo "❌ Error: app.py not found. Make sure you're in the project directory."
    exit 1
fi

# Install Vercel CLI if not present
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod --yes

echo "✅ Deployment initiated!"
echo "🌐 Your system will be live in 2-3 minutes"
echo "📧 Check your email for the deployment URL"
