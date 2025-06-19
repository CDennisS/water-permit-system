#!/usr/bin/env python3
"""
Quick setup script for immediate deployment
"""
import os
import secrets
import subprocess
import sys

def generate_secret_key():
    """Generate a secure secret key"""
    return secrets.token_hex(32)

def check_requirements():
    """Check if all requirements are met"""
    print("🔍 Checking deployment requirements...")
    
    # Check if app.py exists
    if not os.path.exists('app.py'):
        print("❌ app.py not found!")
        return False
    
    # Check if requirements.txt exists
    if not os.path.exists('requirements.txt'):
        print("❌ requirements.txt not found!")
        return False
        
    # Check if vercel.json exists
    if not os.path.exists('vercel.json'):
        print("❌ vercel.json not found!")
        return False
    
    print("✅ All requirements met!")
    return True

def deploy_to_vercel():
    """Deploy to Vercel"""
    print("🚀 Starting Vercel deployment...")
    
    try:
        # Run vercel deploy
        result = subprocess.run(['vercel', '--prod', '--yes'], 
                              capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Deployment successful!")
            print(f"🌐 Output: {result.stdout}")
            return True
        else:
            print(f"❌ Deployment failed: {result.stderr}")
            return False
            
    except FileNotFoundError:
        print("❌ Vercel CLI not found. Installing...")
        subprocess.run(['npm', 'install', '-g', 'vercel'])
        return deploy_to_vercel()

def main():
    """Main deployment function"""
    print("🚀 UMSCC PERMIT SYSTEM - IMMEDIATE DEPLOYMENT")
    print("=" * 50)
    
    if not check_requirements():
        sys.exit(1)
    
    # Generate secret key
    secret_key = generate_secret_key()
    print(f"🔑 Generated secret key: {secret_key[:16]}...")
    
    # Set environment variables
    os.environ['SECRET_KEY'] = secret_key
    os.environ['FLASK_ENV'] = 'production'
    os.environ['DATABASE_URL'] = 'sqlite:///permit_system.db'
    
    # Deploy
    if deploy_to_vercel():
        print("\n🎉 DEPLOYMENT COMPLETE!")
        print("📧 Check your email for the live URL")
        print("🔑 Default login: admin / admin123")
    else:
        print("\n❌ Deployment failed. Check logs above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
