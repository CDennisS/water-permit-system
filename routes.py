from flask import render_template, request, redirect, url_for, flash, jsonify, send_file
from flask_login import login_user, logout_user, login_required, current_user
from app import db
from models import User, PermitApplication, Document, Comment, ActivityLog
from datetime import datetime, timedelta
import os
from werkzeug.utils import secure_filename
import json
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from io import BytesIO
from sqlalchemy import and_, or_, desc, func, extract
import csv
from io import StringIO
from collections import defaultdict
import calendar
from functools import wraps
import pandas as pd
import xlsxwriter
import magic  # for file type detection
import hashlib
from PIL import Image
import fitz  # PyMuPDF for PDF processing

def check_permission(required_role=None, allowed_roles=None, application_status=None):
    """Decorator to check user permissions for routes"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not current_user.is_authenticated:
                flash('Please log in to access this page.')
                return redirect(url_for('login'))
            
            if required_role and current_user.role != required_role:
                flash('You do not have permission to access this page.')
                return redirect(url_for('dashboard'))
            
            if allowed_roles and current_user.role not in allowed_roles:
                flash('You do not have permission to access this page.')
                return redirect(url_for('dashboard'))
            
            if application_status:
                application_id = kwargs.get('application_id')
                if application_id:
                    application = PermitApplication.query.get_or_404(application_id)
                    if application.status != application_status:
                        flash(f'This action requires the application to be in {application_status} status.')
                        return redirect(url_for('view_application', application_id=application_id))
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def allowed_file(filename):
    """Check if file type is allowed"""
    ALLOWED_EXTENSIONS = {
        'pdf': 'application/pdf',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    }
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_file_hash(file_path):
    """Generate SHA-256 hash of file"""
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

def process_document(file_path, document_type):
    """Process document based on type"""
    file_ext = file_path.rsplit('.', 1)[1].lower()
    
    if file_ext in ['jpg', 'jpeg', 'png']:
        # Process image
        with Image.open(file_path) as img:
            # Convert to RGB if needed
            if img.mode != 'RGB':
                img = img.convert('RGB')
            # Resize if too large
            if max(img.size) > 2000:
                ratio = 2000 / max(img.size)
                new_size = tuple(int(dim * ratio) for dim in img.size)
                img = img.resize(new_size, Image.Resampling.LANCZOS)
            # Save processed image
            img.save(file_path, 'JPEG', quality=85)
    
    elif file_ext == 'pdf':
        # Process PDF
        doc = fitz.open(file_path)
        # Compress PDF if needed
        if doc.page_count > 0:
            for page in doc:
                page.clean_contents()
            doc.save(file_path, garbage=4, deflate=True, clean=True)
        doc.close()

def register_routes(app):
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
        if current_user.role == 'Permitting Officer':
            applications = PermitApplication.query.filter_by(status='Unsubmitted').all()
        elif current_user.role == 'Upper Manyame Chairperson':
            applications = PermitApplication.query.filter_by(status='Submitted').all()
        elif current_user.role == 'Manyame Catchment Manager':
            applications = PermitApplication.query.filter_by(status='Chairperson Reviewed').all()
        elif current_user.role == 'Manyame Catchment Chairperson':
            applications = PermitApplication.query.filter_by(status='Manager Reviewed').all()
        else:
            applications = PermitApplication.query.all()
        
        return render_template('dashboard.html', applications=applications)

    @app.route('/new-application')
    @login_required
    @check_permission(allowed_roles=['Permitting Officer'])
    def new_application():
        return render_template('new_application.html')

    @app.route('/submit-application/<int:application_id>', methods=['POST'])
    @login_required
    @check_permission(allowed_roles=['Permitting Officer'], application_status='Unsubmitted')
    def submit_application(application_id):
        application = PermitApplication.query.get_or_404(application_id)
        
        # Validate required documents
        required_docs = ['ID Copy', 'Proof of Residence', 'Proof of Ownership']
        uploaded_docs = [doc.document_type for doc in application.documents]
        missing_docs = [doc for doc in required_docs if doc not in uploaded_docs]
        
        if missing_docs:
            flash(f'Please upload all required documents: {", ".join(missing_docs)}')
            return redirect(url_for('view_application', application_id=application_id))
        
        application.status = 'Submitted'
        application.submitted_at = datetime.now()
        
        # Log the action
        if current_user.role != 'ICT':
            log = ActivityLog(
                application_id=application.id,
                user_id=current_user.id,
                action='Application Submitted',
                details=f'Application submitted by {current_user.username}'
            )
            db.session.add(log)
        
        db.session.commit()
        flash('Application submitted successfully.')
        return redirect(url_for('view_application', application_id=application_id))

    @app.route('/review-application/<int:application_id>', methods=['POST'])
    @login_required
    @check_permission(allowed_roles=['Upper Manyame Chairperson'], application_status='Submitted')
    def review_application(application_id):
        application = PermitApplication.query.get_or_404(application_id)
        application.status = 'Under Review'
        application.reviewed_at = datetime.now()
        application.reviewed_by = current_user.id
        
        # Log the action
        if current_user.role != 'ICT':
            log = ActivityLog(
                application_id=application.id,
                user_id=current_user.id,
                action='Application Reviewed',
                details=f'Application reviewed by {current_user.username}'
            )
            db.session.add(log)
        
        db.session.commit()
        flash('Application reviewed successfully.')
        return redirect(url_for('view_application', application_id=application_id))

    @app.route('/manager-review/<int:application_id>', methods=['POST'])
    @login_required
    @check_permission(allowed_roles=['Manyame Catchment Manager'], application_status='Under Review')
    def manager_review(application_id):
        application = PermitApplication.query.get_or_404(application_id)
        application.status = 'Manager Reviewed'
        application.manager_reviewed_at = datetime.now()
        application.manager_reviewed_by = current_user.id
        
        # Log the action
        if current_user.role != 'ICT':
            log = ActivityLog(
                application_id=application.id,
                user_id=current_user.id,
                action='Manager Review',
                details=f'Application reviewed by manager {current_user.username}'
            )
            db.session.add(log)
        
        db.session.commit()
        flash('Application reviewed by manager successfully.')
        return redirect(url_for('view_application', application_id=application_id))

    @app.route('/approve-application/<int:application_id>', methods=['POST'])
    @login_required
    @check_permission(allowed_roles=['Manyame Catchment Chairperson'], application_status='Manager Reviewed')
    def approve_application(application_id):
        application = PermitApplication.query.get_or_404(application_id)
        application.status = 'Approved'
        application.approved_at = datetime.now()
        application.approved_by = current_user.id
        
        # Generate permit number
        application.permit_number = f'WP-{datetime.now().strftime("%Y%m")}-{application.id:04d}'
        
        # Log the action
        if current_user.role != 'ICT':
            log = ActivityLog(
                application_id=application.id,
                user_id=current_user.id,
                action='Application Approved',
                details=f'Application approved by {current_user.username}'
            )
            db.session.add(log)
        
        db.session.commit()
        flash('Application approved successfully.')
        return redirect(url_for('view_application', application_id=application_id))

    @app.route('/reject-application/<int:application_id>', methods=['POST'])
    @login_required
    @check_permission(allowed_roles=['Manyame Catchment Chairperson'], application_status='Manager Reviewed')
    def reject_application(application_id):
        application = PermitApplication.query.get_or_404(application_id)
        application.status = 'Rejected'
        application.rejected_at = datetime.now()
        application.rejected_by = current_user.id
        
        # Log the action
        if current_user.role != 'ICT':
            log = ActivityLog(
                application_id=application.id,
                user_id=current_user.id,
                action='Application Rejected',
                details=f'Application rejected by {current_user.username}'
            )
            db.session.add(log)
        
        db.session.commit()
        flash('Application rejected successfully.')
        return redirect(url_for('view_application', application_id=application_id))

    @app.route('/documents/<int:application_id>')
    @login_required
    def view_documents(application_id):
        application = PermitApplication.query.get_or_404(application_id)
        
        # Check if user has permission to view documents
        if current_user.role == 'Permitting Officer' and application.created_by != current_user.id:
            flash('You can only view documents for your own applications.')
            return redirect(url_for('dashboard'))
        
        # Get document categories
        document_categories = {
            'Required Documents': ['ID Copy', 'Proof of Residence', 'Proof of Ownership'],
            'Technical Documents': ['Borehole Certificate', 'Capacity Test', 'Water Quality Test'],
            'Additional Documents': ['Other']
        }
        
        # Group documents by category
        documents_by_category = {}
        for category, doc_types in document_categories.items():
            documents_by_category[category] = [
                doc for doc in application.documents 
                if doc.document_type in doc_types
            ]
        
        return render_template('documents.html',
                             application=application,
                             documents_by_category=documents_by_category,
                             document_categories=document_categories)

    @app.route('/upload-document/<int:application_id>', methods=['POST'])
    @login_required
    def upload_document(application_id):
        application = PermitApplication.query.get_or_404(application_id)
        
        # Check if user has permission to upload documents
        if current_user.role == 'Permitting Officer' and application.status != 'Unsubmitted':
            flash('Documents can only be uploaded for unsubmitted applications.')
            return redirect(url_for('view_application', application_id=application_id))
        
        if 'document' not in request.files:
            flash('No document selected.')
            return redirect(url_for('view_documents', application_id=application_id))
        
        file = request.files['document']
        if file.filename == '':
            flash('No document selected.')
            return redirect(url_for('view_documents', application_id=application_id))
        
        if file and allowed_file(file.filename):
            # Create unique filename
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            original_filename = secure_filename(file.filename)
            file_ext = original_filename.rsplit('.', 1)[1].lower()
            filename = f"{application.id}_{timestamp}_{original_filename}"
            
            # Create application-specific directory
            app_dir = os.path.join(app.config['UPLOAD_FOLDER'], str(application.id))
            os.makedirs(app_dir, exist_ok=True)
            
            file_path = os.path.join(app_dir, filename)
            file.save(file_path)
            
            # Process document
            try:
                process_document(file_path, request.form.get('document_type'))
            except Exception as e:
                flash(f'Error processing document: {str(e)}')
                os.remove(file_path)
                return redirect(url_for('view_documents', application_id=application_id))
            
            # Generate file hash
            file_hash = get_file_hash(file_path)
            
            # Create document record
            document = Document(
                application_id=application_id,
                document_type=request.form.get('document_type'),
                original_filename=original_filename,
                file_path=file_path,
                file_hash=file_hash,
                file_size=os.path.getsize(file_path),
                uploaded_by=current_user.id,
                uploaded_at=datetime.now()
            )
            db.session.add(document)
            
            # Log the action
            if current_user.role != 'ICT':
                log = ActivityLog(
                    application_id=application.id,
                    user_id=current_user.id,
                    action='Document Uploaded',
                    details=f'Document {original_filename} uploaded by {current_user.username}'
                )
                db.session.add(log)
            
            db.session.commit()
            flash('Document uploaded successfully.')
        else:
            flash('Invalid file type. Allowed types: PDF, JPG, PNG, DOC, DOCX')
        
        return redirect(url_for('view_documents', application_id=application_id))

    @app.route('/view-document/<int:document_id>')
    @login_required
    def view_document(document_id):
        document = Document.query.get_or_404(document_id)
        application = document.application
        
        # Check if user has permission to view the document
        if current_user.role == 'Permitting Officer' and application.created_by != current_user.id:
            flash('You can only view documents for your own applications.')
            return redirect(url_for('dashboard'))
        
        # Log document view
        if current_user.role != 'ICT':
            log = ActivityLog(
                application_id=application.id,
                user_id=current_user.id,
                action='Document Viewed',
                details=f'Document {document.original_filename} viewed by {current_user.username}'
            )
            db.session.add(log)
            db.session.commit()
        
        return send_file(document.file_path)

    @app.route('/delete-document/<int:document_id>', methods=['POST'])
    @login_required
    def delete_document(document_id):
        document = Document.query.get_or_404(document_id)
        application = document.application
        
        # Check if user has permission to delete the document
        if current_user.role not in ['ICT', 'Permit Supervisor'] and application.created_by != current_user.id:
            flash('You do not have permission to delete this document.')
            return redirect(url_for('view_documents', application_id=application.id))
        
        # Check if application status allows document deletion
        if application.status != 'Unsubmitted' and current_user.role not in ['ICT', 'Permit Supervisor']:
            flash('Documents can only be deleted from unsubmitted applications.')
            return redirect(url_for('view_documents', application_id=application.id))
        
        try:
            # Delete file
            if os.path.exists(document.file_path):
                os.remove(document.file_path)
            
            # Log the action
            if current_user.role != 'ICT':
                log = ActivityLog(
                    application_id=application.id,
                    user_id=current_user.id,
                    action='Document Deleted',
                    details=f'Document {document.original_filename} deleted by {current_user.username}'
                )
                db.session.add(log)
            
            # Delete document record
            db.session.delete(document)
            db.session.commit()
            flash('Document deleted successfully.')
        except Exception as e:
            flash(f'Error deleting document: {str(e)}')
        
        return redirect(url_for('view_documents', application_id=application.id))

    @app.route('/document-history/<int:document_id>')
    @login_required
    def document_history(document_id):
        document = Document.query.get_or_404(document_id)
        application = document.application
        
        # Check if user has permission to view document history
        if current_user.role == 'Permitting Officer' and application.created_by != current_user.id:
            flash('You can only view document history for your own applications.')
            return redirect(url_for('dashboard'))
        
        # Get document history from activity logs
        history = ActivityLog.query.filter(
            ActivityLog.application_id == application.id,
            ActivityLog.details.like(f'%{document.original_filename}%')
        ).order_by(ActivityLog.timestamp.desc()).all()
        
        return render_template('document_history.html',
                             document=document,
                             application=application,
                             history=history)

    @app.route('/application/<int:id>')
    @login_required
    def view_application(id):
        application = PermitApplication.query.get_or_404(id)
        return render_template('view_application.html', application=application)

    @app.route('/application/<int:id>/print')
    @login_required
    def print_permit(id):
        application = PermitApplication.query.get_or_404(id)
        if application.status != 'Approved':
            flash('Can only print approved permits')
            return redirect(url_for('view_application', id=id))
        
        if current_user.role not in ['ICT', 'Permit Supervisor'] and current_user.id != application.created_by:
            flash('Unauthorized to print this permit')
            return redirect(url_for('view_application', id=id))
        
        buffer = BytesIO()
        c = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4

        # Header
        c.setFont("Helvetica-Bold", 14)
        c.drawString(30, height - 40, "Form GW7B")
        c.setFont("Helvetica", 12)
        c.drawString(30, height - 60, "TEMPORARY/PROVISIONAL* SPECIFIC GROUNDWATER ABSTRACTION PERMIT")
        c.setFont("Helvetica", 10)
        c.drawString(30, height - 80, "(Section 15 (3) (a) of Water (Permits) Regulations, 2001)")
        c.setFont("Helvetica-Bold", 12)
        c.drawString(30, height - 110, "The MANYAME Catchment Council hereby grants a *Temporary/Provisional General Abstraction Permit to:")
        c.setFont("Helvetica", 10)
        c.drawString(30, height - 130, "Catchment:  MANYAME     Sub-Catchment: UPPER MANYAME")

        # Applicant details
        y = height - 160
        c.setFont("Helvetica", 10)
        c.drawString(30, y, f"1.  Name of Applicant:  {application.applicant_name}")
        y -= 20
        c.drawString(30, y, f"2.  Physical address: {application.physical_address}")
        y -= 20
        c.drawString(30, y, f"3.  Postal address: ")
        y -= 20
        c.drawString(30, y, f"4.  Number of drilled boreholes: {application.num_boreholes}")
        c.drawString(300, y, f"5.  Size of land or property: {application.land_size} (ha)")
        y -= 20
        c.drawString(30, y, f"Total allocated abstraction (m3/annum): {application.water_allocation}")
        y -= 30
        c.setFont("Helvetica-Bold", 10)
        c.drawString(30, y, "Borehole (BH)-No.   BH-No. Allocated   Grid Reference   GPS reading   Intended usea   Maximum abstraction rate (m3/annum)   Water sample analysis every . months/years")
        y -= 20
        c.setFont("Helvetica", 10)
        c.drawString(30, y, f"1   -   -   X: {application.gps_x}   Y: {application.gps_y}   {application.permit_type}   -   -")
        y -= 30
        c.drawString(30, y, f"a Intended use: irrigation, livestock farming, industrial, mining, urban, national parks, other (specify): {application.permit_type}")
        y -= 30
        c.drawString(30, y, f"This Temporary/Provisional* Specific Abstraction Permit has been recorded in the register as:")
        y -= 20
        c.drawString(30, y, f"Permit No: {application.permit_number}    Valid until: {application.valid_until.strftime('%Y-%m-%d') if application.valid_until else ''}")
        y -= 30
        c.setFont("Helvetica-Bold", 10)
        c.drawString(30, y, "CONDITIONS")
        y -= 20
        c.setFont("Helvetica", 9)
        c.drawString(30, y, "It is illegal to abstract groundwater for any other purpose other than primary purposes without an abstraction permit. ...")
        y -= 40
        c.setFont("Helvetica-Bold", 10)
        c.drawString(30, y, "ADDITIONAL CONDITIONS")
        y -= 20
        c.setFont("Helvetica", 9)
        c.drawString(30, y, "1. To install flow meters on all boreholes and keep records of water used")
        y -= 15
        c.drawString(30, y, "2. Water Quality Analysis is to be carried out at most after every 3 months")
        y -= 15
        c.drawString(30, y, "3. To submit abstraction and water quality records to catchment offices every six (6) months")
        y -= 15
        c.drawString(30, y, "4. To allow unlimited access to ZINWA and SUB-CATCHMENT COUNCIL staff")
        y -= 15
        c.drawString(30, y, "5. No cost shall be demanded from the Catchment Council in the event of permit cancellation")
        y -= 40
        c.setFont("Helvetica", 10)
        c.drawString(30, y, "Name (print)        Signature        Official Date Stamp (Catchment Council Chairperson)")
        c.showPage()
        c.save()
        buffer.seek(0)
        return send_file(buffer, as_attachment=True, download_name=f"Permit_{application.permit_number}.pdf", mimetype='application/pdf')

    @app.route('/reports')
    @login_required
    @check_permission(allowed_roles=['ICT', 'Permit Supervisor'])
    def reports():
        # Get date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)
        
        # Get statistics
        stats = {
            'total_applications': PermitApplication.query.count(),
            'applications_by_status': db.session.query(
                PermitApplication.status,
                func.count(PermitApplication.id)
            ).group_by(PermitApplication.status).all(),
            'applications_by_type': db.session.query(
                PermitApplication.permit_type,
                func.count(PermitApplication.id)
            ).group_by(PermitApplication.permit_type).all(),
            'applications_by_water_source': db.session.query(
                PermitApplication.water_source,
                func.count(PermitApplication.id)
            ).group_by(PermitApplication.water_source).all(),
            'applications_over_time': db.session.query(
                func.date(PermitApplication.created_at),
                func.count(PermitApplication.id)
            ).filter(
                PermitApplication.created_at >= start_date
            ).group_by(
                func.date(PermitApplication.created_at)
            ).all(),
            'processing_times': db.session.query(
                func.avg(
                    extract('epoch', PermitApplication.approved_at) -
                    extract('epoch', PermitApplication.submitted_at)
                )
            ).filter(
                PermitApplication.status == 'Approved'
            ).scalar(),
            'documents_by_type': db.session.query(
                Document.document_type,
                func.count(Document.id)
            ).group_by(Document.document_type).all(),
            'comments_by_user': db.session.query(
                User.username,
                func.count(Comment.id)
            ).join(Comment).group_by(User.username).all()
        }
        
        return render_template('reports.html', stats=stats)

    @app.route('/users')
    @login_required
    def manage_users():
        if current_user.role not in ['ICT', 'Permit Administrator']:
            flash('Unauthorized')
            return redirect(url_for('dashboard'))
        
        users = User.query.all()
        return render_template('users.html', users=users)

    @app.route('/users/new', methods=['GET', 'POST'])
    @login_required
    def new_user():
        if current_user.role not in ['ICT', 'Permit Administrator']:
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
            return redirect(url_for('manage_users'))
        
        return render_template('new_user.html')

    @app.route('/activity-logs')
    @login_required
    @check_permission(allowed_roles=['ICT', 'Permit Supervisor'])
    def activity_logs():
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        action = request.args.get('action')
        role = request.args.get('role')
        page = request.args.get('page', 1, type=int)
        per_page = 20

        query = ActivityLog.query.join(User).join(PermitApplication)

        if start_date:
            query = query.filter(ActivityLog.timestamp >= datetime.strptime(start_date, '%Y-%m-%d'))
        if end_date:
            query = query.filter(ActivityLog.timestamp <= datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=1))
        if action:
            query = query.filter(ActivityLog.action == action)
        if role:
            query = query.filter(User.role == role)

        query = query.order_by(ActivityLog.timestamp.desc())

        pagination = query.paginate(page=page, per_page=per_page)
        logs = pagination.items

        return render_template('activity_logs.html', logs=logs, pagination=pagination)

    @app.route('/activity-logs/stats')
    @login_required
    @check_permission(allowed_roles=['ICT', 'Permit Supervisor'])
    def activity_logs_stats():
        # Get date range from request or default to last 30 days
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)
        
        # Get filter parameters
        start_date = request.args.get('start_date', start_date.strftime('%Y-%m-%d'))
        end_date = request.args.get('end_date', end_date.strftime('%Y-%m-%d'))
        
        # Convert string dates to datetime objects
        start_date = datetime.strptime(start_date, '%Y-%m-%d')
        end_date = datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=1)

        # Enhanced statistics query
        stats = {
            # Basic metrics
            'total_actions': ActivityLog.query.filter(
                ActivityLog.timestamp.between(start_date, end_date)
            ).count(),
            
            'total_applications': PermitApplication.query.filter(
                PermitApplication.created_at.between(start_date, end_date)
            ).count(),
            
            'total_users': User.query.filter(
                User.created_at.between(start_date, end_date)
            ).count(),
            
            # Processing time metrics
            'average_processing_time': db.session.query(
                func.avg(
                    func.extract('epoch', PermitApplication.approved_at - PermitApplication.created_at)
                )
            ).filter(
                PermitApplication.status == 'Approved',
                PermitApplication.created_at.between(start_date, end_date)
            ).scalar() or 0,
            
            'min_processing_time': db.session.query(
                func.min(
                    func.extract('epoch', PermitApplication.approved_at - PermitApplication.created_at)
                )
            ).filter(
                PermitApplication.status == 'Approved',
                PermitApplication.created_at.between(start_date, end_date)
            ).scalar() or 0,
            
            'max_processing_time': db.session.query(
                func.max(
                    func.extract('epoch', PermitApplication.approved_at - PermitApplication.created_at)
                )
            ).filter(
                PermitApplication.status == 'Approved',
                PermitApplication.created_at.between(start_date, end_date)
            ).scalar() or 0,
            
            # Action distribution
            'actions_by_type': db.session.query(
                ActivityLog.action,
                func.count(ActivityLog.id)
            ).filter(
                ActivityLog.timestamp.between(start_date, end_date)
            ).group_by(ActivityLog.action).all(),
            
            'actions_by_role': db.session.query(
                User.role,
                func.count(ActivityLog.id)
            ).join(ActivityLog).filter(
                ActivityLog.timestamp.between(start_date, end_date)
            ).group_by(User.role).all(),
            
            # Time-based metrics
            'actions_by_day': db.session.query(
                func.date(ActivityLog.timestamp),
                func.count(ActivityLog.id)
            ).filter(
                ActivityLog.timestamp.between(start_date, end_date)
            ).group_by(func.date(ActivityLog.timestamp)).all(),
            
            'actions_by_hour': db.session.query(
                extract('hour', ActivityLog.timestamp),
                func.count(ActivityLog.id)
            ).filter(
                ActivityLog.timestamp.between(start_date, end_date)
            ).group_by(extract('hour', ActivityLog.timestamp)).all(),
            
            'actions_by_weekday': db.session.query(
                extract('dow', ActivityLog.timestamp),
                func.count(ActivityLog.id)
            ).filter(
                ActivityLog.timestamp.between(start_date, end_date)
            ).group_by(extract('dow', ActivityLog.timestamp)).all(),
            
            # Application metrics
            'status_distribution': db.session.query(
                PermitApplication.status,
                func.count(PermitApplication.id)
            ).filter(
                PermitApplication.created_at.between(start_date, end_date)
            ).group_by(PermitApplication.status).all(),
            
            'applications_by_type': db.session.query(
                PermitApplication.permit_type,
                func.count(PermitApplication.id)
            ).filter(
                PermitApplication.created_at.between(start_date, end_date)
            ).group_by(PermitApplication.permit_type).all(),
            
            'applications_by_water_source': db.session.query(
                PermitApplication.water_source,
                func.count(PermitApplication.id)
            ).filter(
                PermitApplication.created_at.between(start_date, end_date)
            ).group_by(PermitApplication.water_source).all(),
            
            # User activity metrics
            'most_active_users': db.session.query(
                User.username,
                User.role,
                func.count(ActivityLog.id).label('action_count')
            ).join(ActivityLog).filter(
                ActivityLog.timestamp.between(start_date, end_date)
            ).group_by(User.id).order_by(desc('action_count')).limit(10).all(),
            
            'user_activity_by_role': db.session.query(
                User.role,
                func.count(distinct(User.id)).label('user_count'),
                func.count(ActivityLog.id).label('action_count')
            ).join(ActivityLog).filter(
                ActivityLog.timestamp.between(start_date, end_date)
            ).group_by(User.role).all(),
            
            # Document metrics
            'documents_by_type': db.session.query(
                Document.document_type,
                func.count(Document.id)
            ).filter(
                Document.uploaded_at.between(start_date, end_date)
            ).group_by(Document.document_type).all(),
            
            'average_documents_per_application': db.session.query(
                func.avg(
                    db.session.query(func.count(Document.id))
                    .filter(Document.application_id == PermitApplication.id)
                    .scalar()
                )
            ).filter(
                PermitApplication.created_at.between(start_date, end_date)
            ).scalar() or 0,
            
            # Comment metrics
            'total_comments': Comment.query.filter(
                Comment.created_at.between(start_date, end_date)
            ).count(),
            
            'comments_by_application': db.session.query(
                PermitApplication.permit_number,
                func.count(Comment.id)
            ).join(Comment).filter(
                Comment.created_at.between(start_date, end_date)
            ).group_by(PermitApplication.id).order_by(desc(func.count(Comment.id))).limit(10).all()
        }

        return render_template('activity_logs_stats.html', stats=stats)

    @app.route('/export-logs/<format>')
    @login_required
    @check_permission(allowed_roles=['ICT', 'Permit Supervisor'])
    def export_logs(format):
        # Get filter parameters
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        action = request.args.get('action')
        role = request.args.get('role')
        status = request.args.get('status')
        include_stats = request.args.get('include_stats', 'false').lower() == 'true'

        # Build query
        query = ActivityLog.query.join(User).join(PermitApplication)

        # Apply filters
        if start_date:
            query = query.filter(ActivityLog.timestamp >= datetime.strptime(start_date, '%Y-%m-%d'))
        if end_date:
            query = query.filter(ActivityLog.timestamp <= datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=1))
        if action:
            query = query.filter(ActivityLog.action == action)
        if role:
            query = query.filter(User.role == role)
        if status:
            query = query.filter(PermitApplication.status == status)

        logs = query.order_by(ActivityLog.timestamp.desc()).all()

        # Prepare data
        data = [{
            'timestamp': log.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
            'application': log.application.permit_number,
            'user': log.user.username,
            'role': log.user.role,
            'action': log.action,
            'details': log.details
        } for log in logs]

        if include_stats:
            # Add statistics to the export
            stats = {
                'total_actions': len(data),
                'unique_users': len(set(log['user'] for log in data)),
                'unique_applications': len(set(log['application'] for log in data)),
                'actions_by_type': defaultdict(int),
                'actions_by_role': defaultdict(int)
            }
            
            for log in data:
                stats['actions_by_type'][log['action']] += 1
                stats['actions_by_role'][log['role']] += 1
            
            data = {
                'logs': data,
                'statistics': stats
            }

        if format == 'csv':
            si = StringIO()
            cw = csv.writer(si)
            
            if include_stats:
                # Write statistics
                cw.writerow(['Statistics'])
                cw.writerow(['Total Actions', stats['total_actions']])
                cw.writerow(['Unique Users', stats['unique_users']])
                cw.writerow(['Unique Applications', stats['unique_applications']])
                cw.writerow([])
                
                cw.writerow(['Actions by Type'])
                for action, count in stats['actions_by_type'].items():
                    cw.writerow([action, count])
                cw.writerow([])
                
                cw.writerow(['Actions by Role'])
                for role, count in stats['actions_by_role'].items():
                    cw.writerow([role, count])
                cw.writerow([])
                
                cw.writerow(['Detailed Logs'])
            
            # Write headers
            cw.writerow(['Timestamp', 'Application', 'User', 'Role', 'Action', 'Details'])
            
            # Write data
            for log in (data['logs'] if include_stats else data):
                cw.writerow([
                    log['timestamp'],
                    log['application'],
                    log['user'],
                    log['role'],
                    log['action'],
                    log['details']
                ])
            
            output = si.getvalue()
            si.close()
            
            return send_file(
                StringIO(output),
                mimetype='text/csv',
                as_attachment=True,
                download_name=f'activity_logs_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
            )
        
        elif format == 'json':
            return send_file(
                StringIO(json.dumps(data, indent=2)),
                mimetype='application/json',
                as_attachment=True,
                download_name=f'activity_logs_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
            )
        
        elif format == 'excel':
            if include_stats:
                # Create multiple sheets
                with pd.ExcelWriter(BytesIO(), engine='xlsxwriter') as writer:
                    # Logs sheet
                    pd.DataFrame(data['logs']).to_excel(writer, sheet_name='Activity Logs', index=False)
                    
                    # Statistics sheet
                    stats_df = pd.DataFrame([
                        ['Total Actions', stats['total_actions']],
                        ['Unique Users', stats['unique_users']],
                        ['Unique Applications', stats['unique_applications']]
                    ], columns=['Metric', 'Value'])
                    stats_df.to_excel(writer, sheet_name='Statistics', index=False)
                    
                    # Actions by Type sheet
                    pd.DataFrame(list(stats['actions_by_type'].items()), 
                               columns=['Action', 'Count']).to_excel(
                        writer, sheet_name='Actions by Type', index=False)
                    
                    # Actions by Role sheet
                    pd.DataFrame(list(stats['actions_by_role'].items()),
                               columns=['Role', 'Count']).to_excel(
                        writer, sheet_name='Actions by Role', index=False)
                    
                    # Get the workbook and worksheet objects
                    workbook = writer.book
                    
                    # Add some formatting
                    for sheet_name in writer.sheets:
                        worksheet = writer.sheets[sheet_name]
                        header_format = workbook.add_format({
                            'bold': True,
                            'bg_color': '#4e73df',
                            'font_color': 'white'
                        })
                        worksheet.set_row(0, None, header_format)
                    
                    writer.save()
                    output = writer.buffer.getvalue()
            else:
                # Single sheet with just logs
                df = pd.DataFrame(data)
                output = BytesIO()
                with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
                    df.to_excel(writer, sheet_name='Activity Logs', index=False)
                    
                    # Add formatting
                    workbook = writer.book
                    worksheet = writer.sheets['Activity Logs']
                    header_format = workbook.add_format({
                        'bold': True,
                        'bg_color': '#4e73df',
                        'font_color': 'white'
                    })
                    worksheet.set_row(0, None, header_format)
                    
                    writer.save()
                    output = output.getvalue()
            
            return send_file(
                BytesIO(output),
                mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                as_attachment=True,
                download_name=f'activity_logs_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
            )

        flash('Invalid export format')
        return redirect(url_for('activity_logs'))

    @app.route('/application/<int:id>/edit', methods=['GET', 'POST'])
    @login_required
    def edit_application(id):
        application = PermitApplication.query.get_or_404(id)
        
        # Enhanced edit permissions
        if current_user.role == 'ICT':
            # ICT users can edit any application
            pass
        elif current_user.role == 'Permitting Officer':
            # Permitting Officers can only edit their own unsubmitted applications
            if application.created_by != current_user.id or application.status != 'Unsubmitted':
                flash('Can only edit your own unsubmitted applications')
                return redirect(url_for('dashboard'))
        else:
            flash('Unauthorized to edit applications')
            return redirect(url_for('dashboard'))
        
        if request.method == 'POST':
            # Update application fields
            application.applicant_name = request.form['applicant_name']
            application.physical_address = request.form['physical_address']
            application.account_number = request.form['account_number']
            application.cellular = request.form['cellular']
            application.num_boreholes = int(request.form['num_boreholes'])
            application.land_size = float(request.form['land_size'])
            application.gps_x = float(request.form['gps_x'])
            application.gps_y = float(request.form['gps_y'])
            application.water_source = request.form['water_source']
            application.permit_type = request.form['permit_type']
            
            if application.permit_type == 'Bulk Water':
                application.water_allocation = float(request.form['water_allocation'])
            
            # Log the edit
            if current_user.role != 'ICT':
                log = ActivityLog(
                    application_id=application.id,
                    user_id=current_user.id,
                    action='Application Edited',
                    details=f"Application details updated by {current_user.username}"
                )
                db.session.add(log)
            
            db.session.commit()
            flash('Application updated successfully')
            return redirect(url_for('view_application', id=id))
        
        return render_template('edit_application.html', application=application)
