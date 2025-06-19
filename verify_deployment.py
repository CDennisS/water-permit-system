import requests
import os
import sys
import time
from datetime import datetime

def verify_deployment(url):
    """Verify the deployment by checking various endpoints"""
    print(f"🔍 Verifying deployment at {url}")
    
    # Test cases
    test_cases = [
        {
            'name': 'Homepage',
            'endpoint': '/',
            'expected_status': 200
        },
        {
            'name': 'Static Files',
            'endpoint': '/static/css/style.css',
            'expected_status': 200
        },
        {
            'name': 'Login Page',
            'endpoint': '/login',
            'expected_status': 200
        }
    ]
    
    results = []
    
    for test in test_cases:
        try:
            print(f"\nTesting {test['name']}...")
            response = requests.get(f"{url}{test['endpoint']}")
            
            success = response.status_code == test['expected_status']
            results.append({
                'name': test['name'],
                'status': '✅ PASS' if success else '❌ FAIL',
                'status_code': response.status_code,
                'expected': test['expected_status']
            })
            
            print(f"Status: {results[-1]['status']}")
            print(f"Response Code: {response.status_code}")
            
        except Exception as e:
            results.append({
                'name': test['name'],
                'status': '❌ ERROR',
                'error': str(e)
            })
            print(f"Error: {str(e)}")
        
        time.sleep(1)  # Be nice to the server
    
    # Print summary
    print("\n📊 Deployment Verification Summary:")
    print("=" * 50)
    for result in results:
        print(f"{result['name']}: {result['status']}")
        if 'status_code' in result:
            print(f"  Status Code: {result['status_code']} (Expected: {result['expected']})")
        if 'error' in result:
            print(f"  Error: {result['error']}")
    print("=" * 50)
    
    # Return overall success
    return all(r['status'] == '✅ PASS' for r in results)

if __name__ == '__main__':
    # Get deployment URL from environment or command line
    url = os.getenv('DEPLOYMENT_URL') or sys.argv[1] if len(sys.argv) > 1 else None
    
    if not url:
        print("❌ Error: Please provide deployment URL")
        print("Usage: python verify_deployment.py <deployment_url>")
        sys.exit(1)
    
    # Verify deployment
    success = verify_deployment(url)
    
    # Exit with appropriate status code
    sys.exit(0 if success else 1)
