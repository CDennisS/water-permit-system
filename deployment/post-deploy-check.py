import requests
import json
from datetime import datetime

def check_deployment_health(url):
    """Check if deployment is healthy"""
    try:
        # Check main page
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            print(f"✅ Main page accessible: {url}")
            return True
        else:
            print(f"❌ Main page error: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Connection error: {str(e)}")
        return False

def verify_system_features(base_url):
    """Verify key system features"""
    endpoints = [
        "/",
        "/login",
        "/static/css/style.css"
    ]
    
    results = {}
    for endpoint in endpoints:
        try:
            url = base_url + endpoint
            response = requests.get(url, timeout=5)
            results[endpoint] = response.status_code == 200
            print(f"{'✅' if results[endpoint] else '❌'} {endpoint}: {response.status_code}")
        except:
            results[endpoint] = False
            print(f"❌ {endpoint}: Failed")
    
    return results

if __name__ == "__main__":
    print("🔍 Post-deployment health check")
    print("Enter your Vercel URL when ready...")
