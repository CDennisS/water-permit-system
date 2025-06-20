#!/bin/bash
# UMSCC Permit Management System - Vercel Deployment Script

echo "🚀 Starting Vercel Deployment for UMSCC Permit Management System"
echo "=================================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Login to Vercel (if not already logged in)
echo "🔑 Checking Vercel authentication..."
vercel whoami || vercel login

# Deploy to production
echo "🚀 Deploying to production..."
vercel --prod --yes

echo "✅ Deployment initiated!"
echo "🌐 Your system will be live in 2-3 minutes"
echo "📧 Check your email for the live URL"
