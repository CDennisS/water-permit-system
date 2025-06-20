#!/usr/bin/env python3
"""
Verify deployment is working correctly
"""

import requests
import time
import sys

def verify_deployment(url):
    """Verify the deployment is working"""
    print(f"🔍 Verifying deployment at: {url}")
    
    test_endpoints = [
        ('Homepage', '/'),
        ('Login Page', '/login'),
        ('Static CSS', '/static/css/style.css'),
    ]
    
    results = []
    
    for name, endpoint in test_endpoints:
        try:
            print(f"   Testing {name}...")
            response = requests.get(f"{url}{endpoint}", timeout=10)
            
            if response.status_code == 200:
                results.append(f"✅ {name}: OK")
            else:
                results.append(f"❌ {name}: HTTP {response.status_code}")
                
        except Exception as e:
            results.append(f"❌ {name}: {str(e)}")
        
        time.sleep(1)  # Be nice to the server
    
    print("\n📊 VERIFICATION RESULTS:")
    print("=" * 40)
    for result in results:
        print(result)
    print("=" * 40)
    
    success_count = sum(1 for r in results if r.startswith('✅'))
    total_count = len(results)
    
    if success_count == total_count:
        print("🎉 ALL TESTS PASSED! Your system is working perfectly!")
        return True
    else:
        print(f"⚠️ {success_count}/{total_count} tests passed. Some issues detected.")
        return False

if __name__ == "__main__":
    if len(sys.argv) > 1:
        url = sys.argv[1]
        verify_deployment(url)
    else:
        print("Usage: python verify-deployment.py <your-vercel-url>")
        print("Example: python verify-deployment.py https://your-app.vercel.app")
