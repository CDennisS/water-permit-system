#!/usr/bin/env python3
"""
One-click deployment script for UMSCC Permit Management System
Run this script to deploy immediately to Vercel
"""

import os
import subprocess
import sys
import json
from datetime import datetime

def check_requirements():
    """Check if all deployment requirements are met"""
    print("🔍 Checking deployment requirements...")
    
    required_files = ['app.py', 'vercel.json', 'requirements.txt']
    missing_files = []
    
    for file in required_files:
        if not os.path.exists(file):
            missing_files.append(file)
    
    if missing_files:
        print(f"❌ Missing required files: {', '.join(missing_files)}")
        return False
    
    print("✅ All required files present!")
    return True

def install_vercel_cli():
    """Install Vercel CLI if not present"""
    try:
        subprocess.run(['vercel', '--version'], capture_output=True, check=True)
        print("✅ Vercel CLI already installed")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("📦 Installing Vercel CLI...")
        try:
            subprocess.run(['npm', 'install', '-g', 'vercel'], check=True)
            print("✅ Vercel CLI installed successfully!")
            return True
        except subprocess.CalledProcessError:
            print("❌ Failed to install Vercel CLI. Please install Node.js first.")
            return False

def optimize_for_deployment():
    """Optimize project for deployment"""
    print("🧹 Optimizing project for deployment...")
    
    # Remove unnecessary files
    cleanup_patterns = [
        '**/__pycache__',
        '**/*.pyc',
        '.git',
        'tests',
        'docs',
        'node_modules'
    ]
    
    for pattern in cleanup_patterns:
        try:
            if pattern.startswith('**'):
                # Handle Python cache files
                for root, dirs, files in os.walk('.'):
                    if '__pycache__' in dirs:
                        import shutil
                        shutil.rmtree(os.path.join(root, '__pycache__'))
                    for file in files:
                        if file.endswith('.pyc'):
                            os.remove(os.path.join(root, file))
            else:
                if os.path.exists(pattern):
                    import shutil
                    if os.path.isdir(pattern):
                        shutil.rmtree(pattern)
                    else:
                        os.remove(pattern)
        except Exception as e:
            print(f"⚠️ Could not remove {pattern}: {e}")
    
    print("✅ Project optimized!")

def deploy_to_vercel():
    """Deploy to Vercel"""
    print("🚀 Starting Vercel deployment...")
    print("   This may take 2-3 minutes...")
    
    try:
        # Check if logged in
        result = subprocess.run(['vercel', 'whoami'], capture_output=True, text=True)
        if result.returncode != 0:
            print("🔐 Please log in to Vercel...")
            subprocess.run(['vercel', 'login'], check=True)
        
        # Deploy
        result = subprocess.run(['vercel', '--prod', '--yes'], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Deployment successful!")
            print("🌐 Your system is now live!")
            
            # Extract URL from output
            output_lines = result.stdout.split('\n')
            for line in output_lines:
                if 'https://' in line and 'vercel.app' in line:
                    url = line.strip()
                    print(f"🔗 Live URL: {url}")
                    break
            
            return True
        else:
            print(f"❌ Deployment failed: {result.stderr}")
            return False
            
    except subprocess.CalledProcessError as e:
        print(f"❌ Deployment error: {e}")
        return False

def post_deployment_info():
    """Show post-deployment information"""
    print("\n" + "="*60)
    print("🎉 DEPLOYMENT COMPLETE!")
    print("="*60)
    print("\n🔑 DEFAULT LOGIN CREDENTIALS:")
    print("   Username: admin")
    print("   Password: admin123")
    print("\n🛠️ NEXT STEPS:")
    print("   1. Visit your live URL")
    print("   2. Log in with the default credentials")
    print("   3. Create additional users in Admin > User Management")
    print("   4. Start processing permit applications!")
    print("\n📋 SYSTEM FEATURES:")
    print("   ✅ User Management & Authentication")
    print("   ✅ Permit Application Processing")
    print("   ✅ Document Upload & Management")
    print("   ✅ PDF Generation & Printing")
    print("   ✅ Excel/CSV Export")
    print("   ✅ Activity Logs & Analytics")
    print("   ✅ Role-based Access Control")
    print("\n🎯 Your UMSCC Permit Management System is ready for production!")

def main():
    """Main deployment function"""
    print("🚀 UMSCC PERMIT MANAGEMENT SYSTEM")
    print("   INSTANT DEPLOYMENT TO VERCEL")
    print("="*50)
    print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Step 1: Check requirements
    if not check_requirements():
        sys.exit(1)
    
    # Step 2: Install Vercel CLI
    if not install_vercel_cli():
        sys.exit(1)
    
    # Step 3: Optimize project
    optimize_for_deployment()
    
    # Step 4: Deploy
    if deploy_to_vercel():
        post_deployment_info()
    else:
        print("\n❌ Deployment failed. Please check the errors above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
