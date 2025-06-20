from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
from werkzeug.middleware.proxy_fix import ProxyFix
from config import config
from utils.s3_storage import s3_storage
from werkzeug.security import generate_password_hash, check_password_hash

# Load environment variables
load_dotenv()

# Create Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'umscc-permit-system-secret-2025')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///permit_system.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'

# User Model
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    role = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

# Application Model
class PermitApplication(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    permit_number = db.Column(db.String(20), unique=True)
    applicant_name = db.Column(db.String(100), nullable=False)
    physical_address = db.Column(db.String(200), nullable=False)
    account_number = db.Column(db.String(50))
    cellular = db.Column(db.String(20))
    num_boreholes = db.Column(db.Integer)
    land_size = db.Column(db.Float)
    gps_x = db.Column(db.Float)
    gps_y = db.Column(db.Float)
    water_source = db.Column(db.String(50))
    permit_type = db.Column(db.String(50))
    status = db.Column(db.String(20), default='Unsubmitted')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    submitted_at = db.Column(db.DateTime)
    approved_at = db.Column(db.DateTime)
    valid_until = db.Column(db.DateTime)
    water_allocation = db.Column(db.Float)

# Activity Log Model
class ActivityLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    application_id = db.Column(db.Integer, db.ForeignKey('permit_application.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    action = db.Column(db.String(100), nullable=False)
    details = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Routes
@app.route('/')
def index():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    return render_template('login.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password):
            login_user(user)
            return redirect(url_for('dashboard'))
        flash('Invalid username or password')
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/dashboard')
@login_required
def dashboard():
    applications = PermitApplication.query.all()
    return render_template('dashboard.html', applications=applications)

@app.route('/new-application', methods=['GET', 'POST'])
@login_required
def new_application():
    if request.method == 'POST':
        application = PermitApplication(
            applicant_name=request.form['applicant_name'],
            physical_address=request.form['physical_address'],
            account_number=request.form.get('account_number'),
            cellular=request.form['cellular'],
            num_boreholes=int(request.form['num_boreholes']),
            land_size=float(request.form['land_size']),
            gps_x=float(request.form['gps_x']),
            gps_y=float(request.form['gps_y']),
            water_source=request.form['water_source'],
            permit_type=request.form['permit_type'],
            water_allocation=float(request.form.get('water_allocation', 0))
        )
        
        # Generate permit number
        year = datetime.utcnow().year
        count = PermitApplication.query.count()
        application.permit_number = f'WP-{year}-{count + 1:04d}'
        
        db.session.add(application)
        db.session.commit()
        
        flash('Application created successfully!')
        return redirect(url_for('dashboard'))
    
    return render_template('new_application.html')

@app.route('/application/<int:id>')
@login_required
def view_application(id):
    application = PermitApplication.query.get_or_404(id)
    return render_template('view_application.html', application=application)

@app.route('/application/<int:id>/approve', methods=['POST'])
@login_required
def approve_application(id):
    if current_user.role != 'Manyame Catchment Chairperson':
        flash('Unauthorized')
        return redirect(url_for('dashboard'))
    
    application = PermitApplication.query.get_or_404(id)
    application.status = 'Approved'
    application.approved_at = datetime.utcnow()
    application.valid_until = datetime.utcnow() + timedelta(days=5*365)  # 5 years
    
    # Log activity
    log = ActivityLog(
        application_id=application.id,
        user_id=current_user.id,
        action='Application Approved',
        details=f'Application approved by {current_user.username}'
    )
    db.session.add(log)
    db.session.commit()
    
    flash('Application approved successfully!')
    return redirect(url_for('view_application', id=id))

@app.route('/users')
@login_required
def manage_users():
    if current_user.role not in ['ICT', 'Permit Supervisor']:
        flash('Unauthorized')
        return redirect(url_for('dashboard'))
    
    users = User.query.all()
    return render_template('users.html', users=users)

@app.route('/users/new', methods=['GET', 'POST'])
@login_required
def new_user():
    if current_user.role not in ['ICT', 'Permit Supervisor']:
        flash('Unauthorized')
        return redirect(url_for('dashboard'))
    
    if request.method == 'POST':
        user = User(
            username=request.form['username'],
            role=request.form['role']
        )
        user.set_password(request.form['password'])
        db.session.add(user)
        db.session.commit()
        flash('User created successfully!')
        return redirect(url_for('manage_users'))
    
    return render_template('new_user.html')

# Initialize database
@app.before_first_request
def create_tables():
    db.create_all()
    
    # Create default admin user if not exists
    if not User.query.filter_by(username='admin').first():
        admin = User(
            username='admin',
            role='ICT'
        )
        admin.set_password('admin123')
        db.session.add(admin)
        db.session.commit()

# Vercel handler
def handler(event, context):
    return app(event, context)

if __name__ == '__main__':
    app.run(debug=True)
