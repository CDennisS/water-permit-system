from flask import Flask, render_template, request, redirect, url_for, flash, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
from werkzeug.middleware.proxy_fix import ProxyFix
from config import config
from utils.s3_storage import s3_storage

# Load environment variables
load_dotenv()

def create_app(config_name='default'):
    """Application factory function"""
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config[config_name])
    
    # Handle proxy headers
    app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)
    
    # Initialize extensions with app
    db = SQLAlchemy(app)
    login_manager = LoginManager(app)
    login_manager.login_view = 'login'
    
    # Import models and routes
    from models import User, PermitApplication, Document, Comment, ActivityLog
    from routes import register_routes
    
    # Register routes
    register_routes(app)
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    @app.route('/')
    def index():
        if current_user.is_authenticated:
            return redirect(url_for('dashboard'))
        return render_template('login.html')
    
    # Serve static files with caching
    @app.route('/static/<path:filename>')
    def serve_static(filename):
        return send_from_directory('static', filename, cache_timeout=31536000)
    
    return app

# Create the application instance
app = create_app(os.getenv('FLASK_ENV', 'default'))

# Vercel serverless function handler
def handler(event, context):
    return app(event, context)

if __name__ == '__main__':
    app.run() 