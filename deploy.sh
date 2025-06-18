#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting deployment process..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Login to Vercel if not already logged in
if ! vercel whoami &> /dev/null; then
    echo "🔑 Logging into Vercel..."
    vercel login
fi

# Set up environment variables
echo "⚙️ Setting up environment variables..."
export SECRET_KEY=$(python -c 'import secrets; print(secrets.token_hex(32))')
export DATABASE_URL="your_database_url_here"
export AWS_ACCESS_KEY_ID="your_aws_access_key"
export AWS_SECRET_ACCESS_KEY="your_aws_secret_key"
export AWS_BUCKET_NAME="your_bucket_name"
export AWS_REGION="your_aws_region"

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

# Get deployment URL
DEPLOYMENT_URL=$(vercel ls | grep -o 'https://[^ ]*' | head -n 1)
echo "🌐 Deployment URL: $DEPLOYMENT_URL"

# Initialize database
echo "🗃️ Initializing database..."
vercel run python seed.py

# Verify deployment
echo "🔍 Verifying deployment..."
python verify_deployment.py "$DEPLOYMENT_URL"

echo "✅ Deployment completed successfully!" 