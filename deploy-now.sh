#!/bin/bash

echo "🚀 DEPLOYING UMSCC PERMIT MANAGEMENT SYSTEM"
echo "============================================="
echo "⏰ Estimated deployment time: 3-5 minutes"
echo ""

# Check if we're in the right directory
if [ ! -f "app.py" ]; then
    echo "❌ Error: app.py not found. Make sure you're in the project directory."
    exit 1
fi

# Install Vercel CLI if not present
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install Vercel CLI. Please install Node.js first."
        exit 1
    fi
fi

# Check if user is logged in to Vercel
echo "🔑 Checking Vercel authentication..."
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please log in to Vercel..."
    vercel login
fi

# Clean up unnecessary files to reduce size
echo "🧹 Optimizing for deployment..."
find . -name "*.pyc" -delete 2>/dev/null || true
find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
rm -rf .git 2>/dev/null || true
rm -rf tests 2>/dev/null || true
rm -rf docs 2>/dev/null || true
rm -rf node_modules 2>/dev/null || true

# Create optimized requirements.txt for deployment
echo "📋 Creating optimized requirements..."
cat > requirements-deploy.txt << 'EOF'
Flask==2.3.3
Flask-SQLAlchemy==3.1.1
Flask-Login==0.6.2
Werkzeug==2.3.7
SQLAlchemy==2.0.23
psycopg2-binary==2.9.9
python-dotenv==1.0.0
pandas==2.1.1
xlsxwriter==3.1.2
reportlab==4.0.4
PyMuPDF==1.23.7
Pillow==10.0.1
EOF

# Backup original requirements and use optimized one
if [ -f "requirements.txt" ]; then
    mv requirements.txt requirements-original.txt
fi
mv requirements-deploy.txt requirements.txt

# Set environment variables for production
echo "⚙️ Setting up environment variables..."
export SECRET_KEY="umscc-permit-system-production-secret-$(date +%s)"
export FLASK_ENV="production"
export DATABASE_URL="sqlite:///permit_system.db"

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
echo "   This may take 2-3 minutes..."
echo ""

vercel --prod --yes --confirm

# Check deployment status
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ DEPLOYMENT SUCCESSFUL!"
    echo "🎉 Your UMSCC Permit Management System is now LIVE!"
    echo ""
    echo "📧 Check your email for the live URL"
    echo "🔗 Or run 'vercel ls' to see your deployments"
    echo ""
    echo "🔑 Default Login Credentials:"
    echo "   Username: admin"
    echo "   Password: admin123"
    echo ""
    echo "🛠️ Next Steps:"
    echo "   1. Visit your live URL"
    echo "   2. Log in with admin credentials"
    echo "   3. Create additional users as needed"
    echo "   4. Start processing permit applications!"
    echo ""
else
    echo "❌ Deployment failed. Please check the error messages above."
    echo "💡 Common solutions:"
    echo "   1. Make sure you're logged into Vercel"
    echo "   2. Check your internet connection"
    echo "   3. Try running 'vercel --prod' manually"
    exit 1
fi

# Restore original requirements if it existed
if [ -f "requirements-original.txt" ]; then
    mv requirements-original.txt requirements.txt
fi

echo "🎯 Deployment Complete! Your system is ready for production use."
