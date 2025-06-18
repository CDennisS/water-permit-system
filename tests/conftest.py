import pytest
from app import app, db
from models import User, Role, PermitApplication, Document, Comment, ActivityLog
from werkzeug.security import generate_password_hash
import os
import tempfile

@pytest.fixture
def client():
    # Create a temporary file to isolate the database for each test
    db_fd, db_path = tempfile.mkstemp()
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
    app.config['TESTING'] = True
    app.config['WTF_CSRF_ENABLED'] = False

    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            # Create test roles
            roles = {
                'Permitting Officer': Role(name='Permitting Officer'),
                'Upper Manyame Chairperson': Role(name='Upper Manyame Chairperson'),
                'Manyame Catchment Manager': Role(name='Manyame Catchment Manager'),
                'Manyame Catchment Chairperson': Role(name='Manyame Catchment Chairperson'),
                'ICT': Role(name='ICT'),
                'Permit Supervisor': Role(name='Permit Supervisor')
            }
            for role in roles.values():
                db.session.add(role)
            db.session.commit()

            # Create test users
            users = {
                'officer': User(
                    username='officer',
                    email='officer@test.com',
                    password_hash=generate_password_hash('test123'),
                    role=roles['Permitting Officer']
                ),
                'chairperson': User(
                    username='chairperson',
                    email='chairperson@test.com',
                    password_hash=generate_password_hash('test123'),
                    role=roles['Upper Manyame Chairperson']
                ),
                'manager': User(
                    username='manager',
                    email='manager@test.com',
                    password_hash=generate_password_hash('test123'),
                    role=roles['Manyame Catchment Manager']
                ),
                'ict': User(
                    username='ict',
                    email='ict@test.com',
                    password_hash=generate_password_hash('test123'),
                    role=roles['ICT']
                )
            }
            for user in users.values():
                db.session.add(user)
            db.session.commit()

        yield client

    # Clean up
    os.close(db_fd)
    os.unlink(db_path)

@pytest.fixture
def auth_client(client):
    """Client with authenticated user"""
    with client.session_transaction() as session:
        session['_user_id'] = '1'  # Set user ID in session
    return client

@pytest.fixture
def test_application():
    """Create a test application"""
    application = PermitApplication(
        applicant_name='Test Applicant',
        contact_number='1234567890',
        email='applicant@test.com',
        physical_address='123 Test St',
        water_source='Test River',
        water_use='Irrigation',
        abstraction_volume=100,
        status='Pending'
    )
    db.session.add(application)
    db.session.commit()
    return application 