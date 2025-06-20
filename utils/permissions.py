from functools import wraps
from flask import flash, redirect, url_for
from flask_login import current_user

def check_permission(required_role=None, allowed_roles=None, application_status=None):
    """Decorator to check user permissions for routes"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not current_user.is_authenticated:
                flash('Please log in to access this page.')
                return redirect(url_for('auth.login'))
            
            if required_role and current_user.role != required_role:
                flash('You do not have permission to access this page.')
                return redirect(url_for('applications.dashboard'))
            
            if allowed_roles and current_user.role not in allowed_roles:
                flash('You do not have permission to access this page.')
                return redirect(url_for('applications.dashboard'))
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator
