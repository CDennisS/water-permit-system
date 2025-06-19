from app import db
from flask_login import UserMixin
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash

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
    
    # Relationships
    documents = db.relationship('Document', backref='application', lazy=True)
    comments = db.relationship('Comment', backref='application', lazy=True)
    activities = db.relationship('ActivityLog', backref='application', lazy=True)

    def generate_permit_number(self):
        year = datetime.utcnow().year
        count = PermitApplication.query.filter(
            PermitApplication.permit_number.like(f'MC{year}-%')
        ).count()
        return f'MC{year}-{count + 1}'

    def set_validity_period(self):
        if self.permit_type == 'Bulk Water':
            # Bulk water permits have custom validity period
            return
        self.valid_until = datetime.utcnow() + timedelta(days=5*365)  # 5 years

class Document(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    application_id = db.Column(db.Integer, db.ForeignKey('permit_application.id'), nullable=False)
    document_type = db.Column(db.String(50), nullable=False)
    file_path = db.Column(db.String(200), nullable=False)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    application_id = db.Column(db.Integer, db.ForeignKey('permit_application.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user = db.relationship('User', backref='comments')

class ActivityLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    application_id = db.Column(db.Integer, db.ForeignKey('permit_application.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    action = db.Column(db.String(100), nullable=False)
    details = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    user = db.relationship('User', backref='activities')
