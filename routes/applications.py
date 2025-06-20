from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify
from flask_login import login_required, current_user
from models import PermitApplication, ActivityLog
from extensions import db
from datetime import datetime, timedelta
from utils.permissions import check_permission

applications_bp = Blueprint('applications', __name__)

@applications_bp.route('/dashboard')
@login_required
def dashboard():
    # Role-based application filtering
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

@applications_bp.route('/new', methods=['GET', 'POST'])
@login_required
@check_permission(allowed_roles=['Permitting Officer', 'ICT'])
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
            water_allocation=float(request.form.get('water_allocation', 0)),
            created_by=current_user.id
        )
        
        # Generate permit number
        year = datetime.utcnow().year
        count = PermitApplication.query.count()
        application.permit_number = f'WP-{year}-{count + 1:04d}'
        
        db.session.add(application)
        
        # Log activity
        log = ActivityLog(
            application_id=application.id,
            user_id=current_user.id,
            action='New Application',
            details=f'Application created by {current_user.username}'
        )
        db.session.add(log)
        db.session.commit()
        
        flash('Application created successfully!')
        return redirect(url_for('applications.view_application', id=application.id))
    
    return render_template('new_application.html')

@applications_bp.route('/<int:id>')
@login_required
def view_application(id):
    application = PermitApplication.query.get_or_404(id)
    return render_template('view_application.html', application=application)

@applications_bp.route('/<int:id>/edit', methods=['GET', 'POST'])
@login_required
def edit_application(id):
    application = PermitApplication.query.get_or_404(id)
    
    # Permission check
    if current_user.role == 'Permitting Officer' and application.created_by != current_user.id:
        flash('Can only edit your own applications')
        return redirect(url_for('applications.dashboard'))
    
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
        log = ActivityLog(
            application_id=application.id,
            user_id=current_user.id,
            action='Application Edited',
            details=f"Application details updated by {current_user.username}"
        )
        db.session.add(log)
        db.session.commit()
        
        flash('Application updated successfully')
        return redirect(url_for('applications.view_application', id=id))
    
    return render_template('edit_application.html', application=application)

@applications_bp.route('/<int:id>/submit', methods=['POST'])
@login_required
@check_permission(allowed_roles=['Permitting Officer'])
def submit_application(id):
    application = PermitApplication.query.get_or_404(id)
    
    if application.status != 'Unsubmitted':
        flash('Application already submitted')
        return redirect(url_for('applications.view_application', id=id))
    
    # Validate required documents
    required_docs = ['ID Copy', 'Proof of Residence', 'Proof of Ownership']
    uploaded_docs = [doc.document_type for doc in application.documents]
    missing_docs = [doc for doc in required_docs if doc not in uploaded_docs]
    
    if missing_docs:
        flash(f'Please upload all required documents: {", ".join(missing_docs)}')
        return redirect(url_for('applications.view_application', id=id))
    
    application.status = 'Submitted'
    application.submitted_at = datetime.now()
    
    # Log the action
    log = ActivityLog(
        application_id=application.id,
        user_id=current_user.id,
        action='Application Submitted',
        details=f'Application submitted by {current_user.username}'
    )
    db.session.add(log)
    db.session.commit()
    
    flash('Application submitted successfully.')
    return redirect(url_for('applications.view_application', id=id))

@applications_bp.route('/<int:id>/approve', methods=['POST'])
@login_required
@check_permission(allowed_roles=['Manyame Catchment Chairperson'])
def approve_application(id):
    application = PermitApplication.query.get_or_404(id)
    
    if application.status != 'Manager Reviewed':
        flash('Application not ready for approval')
        return redirect(url_for('applications.view_application', id=id))
    
    application.status = 'Approved'
    application.approved_at = datetime.now()
    application.valid_until = datetime.now() + timedelta(days=5*365)  # 5 years
    
    # Log the action
    log = ActivityLog(
        application_id=application.id,
        user_id=current_user.id,
        action='Application Approved',
        details=f'Application approved by {current_user.username}'
    )
    db.session.add(log)
    db.session.commit()
    
    flash('Application approved successfully.')
    return redirect(url_for('applications.view_application', id=id))

@applications_bp.route('/<int:id>/reject', methods=['POST'])
@login_required
@check_permission(allowed_roles=['Manyame Catchment Chairperson'])
def reject_application(id):
    application = PermitApplication.query.get_or_404(id)
    
    application.status = 'Rejected'
    application.rejected_at = datetime.now()
    
    # Log the action
    log = ActivityLog(
        application_id=application.id,
        user_id=current_user.id,
        action='Application Rejected',
        details=f'Application rejected by {current_user.username}'
    )
    db.session.add(log)
    db.session.commit()
    
    flash('Application rejected.')
    return redirect(url_for('applications.view_application', id=id))

@applications_bp.route('/<int:id>/print')
@login_required
def print_permit(id):
    """Generate and download permit PDF"""
    from utils.pdf_generator import generate_permit_pdf
    
    application = PermitApplication.query.get_or_404(id)
    
    if application.status != 'Approved':
        flash('Can only print approved permits')
        return redirect(url_for('applications.view_application', id=id))
    
    return generate_permit_pdf(application)
