import os
from datetime import timedelta

# Logging Configuration
LOGGING_CONFIG = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'standard': {
            'format': '%(asctime)s [%(levelname)s] %(name)s: %(message)s'
        },
        'detailed': {
            'format': '%(asctime)s [%(levelname)s] %(name)s [%(filename)s:%(lineno)d]: %(message)s'
        }
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'level': 'INFO',
            'formatter': 'standard',
            'stream': 'ext://sys.stdout'
        },
        'file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'level': 'DEBUG',
            'formatter': 'detailed',
            'filename': 'logs/app.log',
            'maxBytes': 10485760,  # 10MB
            'backupCount': 5
        },
        'error_file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'level': 'ERROR',
            'formatter': 'detailed',
            'filename': 'logs/error.log',
            'maxBytes': 10485760,  # 10MB
            'backupCount': 5
        }
    },
    'loggers': {
        '': {  # Root logger
            'handlers': ['console', 'file', 'error_file'],
            'level': os.getenv('LOG_LEVEL', 'INFO'),
            'propagate': True
        },
        'app': {
            'handlers': ['console', 'file', 'error_file'],
            'level': 'DEBUG',
            'propagate': False
        },
        'werkzeug': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False
        }
    }
}

# Performance Monitoring
PERFORMANCE_CONFIG = {
    'slow_request_threshold': 1.0,  # seconds
    'enable_request_logging': True,
    'enable_performance_tracking': True,
    'performance_log_file': 'logs/performance.log'
}

# Error Tracking
ERROR_TRACKING_CONFIG = {
    'max_errors': 1000,
    'error_log_file': 'logs/errors.log',
    'enable_error_notification': True,
    'notification_threshold': 5,  # number of errors before notification
    'notification_cooldown': timedelta(minutes=30)
}

# Security Monitoring
SECURITY_CONFIG = {
    'enable_security_logging': True,
    'security_log_file': 'logs/security.log',
    'track_failed_logins': True,
    'max_failed_logins': 5,
    'login_attempt_window': timedelta(minutes=15)
}

# Database Monitoring
DB_MONITORING_CONFIG = {
    'enable_query_logging': True,
    'slow_query_threshold': 1.0,  # seconds
    'query_log_file': 'logs/db_queries.log'
}

# API Monitoring
API_MONITORING_CONFIG = {
    'enable_api_logging': True,
    'api_log_file': 'logs/api.log',
    'track_response_times': True,
    'response_time_threshold': 0.5  # seconds
} 