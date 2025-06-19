import pytest
import sys
import os

def main():
    """Run the test suite"""
    # Add the project root directory to Python path
    sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

    # Run pytest with coverage
    args = [
        '--verbose',
        '--cov=app',
        '--cov-report=term-missing',
        '--cov-report=html',
        'tests/'
    ]
    
    return pytest.main(args)

if __name__ == '__main__':
    sys.exit(main())
