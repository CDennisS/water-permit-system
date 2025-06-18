import logging
import os
from datetime import datetime
import json
from functools import wraps
import time
import traceback
from flask import request, current_app

# Configure logging
def setup_logging():
    log_level = os.getenv('LOG_LEVEL', 'INFO')
    log_format = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    
    # Create logs directory if it doesn't exist
    os.makedirs('logs', exist_ok=True)
    
    # Configure file handler
    file_handler = logging.FileHandler(f'logs/app_{datetime.now().strftime("%Y%m%d")}.log')
    file_handler.setFormatter(logging.Formatter(log_format))
    
    # Configure console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(logging.Formatter(log_format))
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level))
    root_logger.addHandler(file_handler)
    root_logger.addHandler(console_handler)
    
    return root_logger

# Performance monitoring decorator
def monitor_performance(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        start_time = time.time()
        try:
            result = f(*args, **kwargs)
            duration = time.time() - start_time
            
            # Log performance metrics
            current_app.logger.info(
                f"Performance: {f.__name__} - Duration: {duration:.2f}s - "
                f"Method: {request.method} - Path: {request.path}"
            )
            
            return result
        except Exception as e:
            duration = time.time() - start_time
            current_app.logger.error(
                f"Error in {f.__name__} - Duration: {duration:.2f}s - "
                f"Error: {str(e)} - Traceback: {traceback.format_exc()}"
            )
            raise
    return decorated_function

# Error tracking
class ErrorTracker:
    def __init__(self):
        self.errors = []
    
    def track_error(self, error, context=None):
        error_data = {
            'timestamp': datetime.now().isoformat(),
            'error_type': type(error).__name__,
            'error_message': str(error),
            'traceback': traceback.format_exc(),
            'context': context or {}
        }
        self.errors.append(error_data)
        current_app.logger.error(json.dumps(error_data))
    
    def get_errors(self, limit=100):
        return self.errors[-limit:]

# Request logging middleware
class RequestLogger:
    def __init__(self, app):
        self.app = app
    
    def __call__(self, environ, start_response):
        start_time = time.time()
        
        def custom_start_response(status, headers, exc_info=None):
            duration = time.time() - start_time
            request_data = {
                'timestamp': datetime.now().isoformat(),
                'method': environ.get('REQUEST_METHOD'),
                'path': environ.get('PATH_INFO'),
                'status': status.split()[0],
                'duration': f"{duration:.2f}s",
                'user_agent': environ.get('HTTP_USER_AGENT'),
                'ip': environ.get('REMOTE_ADDR')
            }
            current_app.logger.info(json.dumps(request_data))
            return start_response(status, headers, exc_info)
        
        return self.app(environ, custom_start_response)

# Initialize monitoring
logger = setup_logging()
error_tracker = ErrorTracker() 