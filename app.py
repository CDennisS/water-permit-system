from flask import Flask
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def create_app():
    """Application factory pattern for better modularity"""
    app = Flask(__name__)
    
    # Configuration
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'umscc-permit-system-secret-2025')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///permit_system.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB
    
    # Initialize core extensions
    from extensions import init_extensions
    init_extensions(app)
    
    # Register blueprints (modular loading)
    register_blueprints(app)
    
    # Initialize database
    with app.app_context():
        from extensions import db
        db.create_all()
        create_default_users()
    
    return app

def register_blueprints(app):
    """Register all blueprints for modular functionality"""
    from routes.auth import auth_bp
    from routes.applications import applications_bp
    from routes.documents import documents_bp
    from routes.admin import admin_bp
    from routes.reports import reports_bp
    from routes.activity_logs import logs_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(applications_bp, url_prefix='/applications')
    app.register_blueprint(documents_bp, url_prefix='/documents')
    app.register_blueprint(admin_bp, url_prefix='/admin')
    app.register_blueprint(reports_bp, url_prefix='/reports')
    app.register_blueprint(logs_bp, url_prefix='/logs')

def create_default_users():
    """Create default users if they don't exist"""
    from models import User
    from extensions import db
    
    if not User.query.filter_by(username='admin').first():
        admin = User(username='admin', role='ICT')
        admin.set_password('admin123')
        db.session.add(admin)
        db.session.commit()

# Create app instance
app = create_app()

# Vercel handler
def handler(event, context):
    return app(event, context)

if __name__ == '__main__':
    app.run(debug=True)
