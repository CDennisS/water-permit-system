from extensions import db
from sqlalchemy import text

class OptimizedPermitApplication(db.Model):
    __tablename__ = 'permit_applications'
    
    id = db.Column(db.Integer, primary_key=True)
    # Core fields only
    applicant_name = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(20), default='Unsubmitted')
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    
    @classmethod
    def get_dashboard_data(cls):
        """Optimized query for dashboard"""
        return db.session.execute(
            text("""
                SELECT status, COUNT(*) as count 
                FROM permit_applications 
                GROUP BY status
            """)
        ).fetchall()
