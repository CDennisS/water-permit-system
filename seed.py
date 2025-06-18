from app import create_app, db
from models import User, Role
from werkzeug.security import generate_password_hash
import logging

def seed_database():
    app = create_app()
    with app.app_context():
        try:
            # Create roles if they don't exist
            roles = [
                'Permitting Officer',
                'Upper Manyame Chairperson',
                'Manyame Catchment Manager',
                'Manyame Catchment Chairperson',
                'ICT',
                'Permit Supervisor'
            ]
            
            for role_name in roles:
                role = Role.query.filter_by(name=role_name).first()
                if not role:
                    role = Role(name=role_name)
                    db.session.add(role)
            
            # Create default ICT/Admin user
            admin_role = Role.query.filter_by(name='ICT').first()
            if not User.query.filter_by(username='admin').first():
                admin = User(
                    username='admin',
                    email='admin@waterpermit.gov.zw',
                    password_hash=generate_password_hash('Admin@123'),
                    role='ICT',
                    is_active=True
                )
                db.session.add(admin)
            
            # Create default Permit Supervisor
            supervisor_role = Role.query.filter_by(name='Permit Supervisor').first()
            if not User.query.filter_by(username='supervisor').first():
                supervisor = User(
                    username='supervisor',
                    email='supervisor@waterpermit.gov.zw',
                    password_hash=generate_password_hash('Supervisor@123'),
                    role='Permit Supervisor',
                    is_active=True
                )
                db.session.add(supervisor)
            
            # Create default Permitting Officer
            officer_role = Role.query.filter_by(name='Permitting Officer').first()
            if not User.query.filter_by(username='officer').first():
                officer = User(
                    username='officer',
                    email='officer@waterpermit.gov.zw',
                    password_hash=generate_password_hash('Officer@123'),
                    role='Permitting Officer',
                    is_active=True
                )
                db.session.add(officer)
            
            # Create default Upper Manyame Chairperson
            chairperson_role = Role.query.filter_by(name='Upper Manyame Chairperson').first()
            if not User.query.filter_by(username='chairperson').first():
                chairperson = User(
                    username='chairperson',
                    email='chairperson@waterpermit.gov.zw',
                    password_hash=generate_password_hash('Chairperson@123'),
                    role='Upper Manyame Chairperson',
                    is_active=True
                )
                db.session.add(chairperson)
            
            # Create default Manyame Catchment Manager
            manager_role = Role.query.filter_by(name='Manyame Catchment Manager').first()
            if not User.query.filter_by(username='manager').first():
                manager = User(
                    username='manager',
                    email='manager@waterpermit.gov.zw',
                    password_hash=generate_password_hash('Manager@123'),
                    role='Manyame Catchment Manager',
                    is_active=True
                )
                db.session.add(manager)
            
            # Create default Manyame Catchment Chairperson
            catchment_chairperson_role = Role.query.filter_by(name='Manyame Catchment Chairperson').first()
            if not User.query.filter_by(username='catchment_chairperson').first():
                catchment_chairperson = User(
                    username='catchment_chairperson',
                    email='catchment_chairperson@waterpermit.gov.zw',
                    password_hash=generate_password_hash('CatchmentChairperson@123'),
                    role='Manyame Catchment Chairperson',
                    is_active=True
                )
                db.session.add(catchment_chairperson)
            
            db.session.commit()
            logging.info("Database seeded successfully!")
            
        except Exception as e:
            db.session.rollback()
            logging.error(f"Error seeding database: {str(e)}")
            raise

if __name__ == '__main__':
    seed_database() 