from flask import Flask
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def create_app():
    """Serverless-optimized Flask app factory"""
    app = Flask(__name__)
    
    # Minimal configuration for serverless
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'umscc-permit-system-secret-2025')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///permit_system.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB for serverless
    
    # Initialize lightweight extensions
    from extensions import init_lightweight_extensions
    init_lightweight_extensions(app)
    
    # Register optimized routes
    register_lightweight_routes(app)
    
    # Initialize database with minimal footprint
    with app.app_context():
        from extensions import db
        db.create_all()
        create_essential_users()
    
    return app

def register_lightweight_routes(app):
    """Register essential routes only"""
    from routes.auth import auth_bp
    from routes.applications import applications_bp
    from routes.serverless_routes import serverless_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(applications_bp, url_prefix='/applications')
    app.register_blueprint(serverless_bp, url_prefix='/api')

def create_essential_users():
    """Create only essential users"""
    from models import User
    from extensions import db
    
    if not User.query.filter_by(username='admin').first():
        admin = User(username='admin', role='ICT')
        admin.set_password('admin123')
        db.session.add(admin)
        db.session.commit()

# Create optimized app instance
app = create_app()

# Vercel serverless handler
def handler(event, context):
    """Optimized Vercel handler"""
    return app(event, context)

if __name__ == '__main__':
    app.run(debug=False)  # Disable debug for production
