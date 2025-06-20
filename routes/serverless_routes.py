"""
Serverless-optimized routes for essential functionality
"""
from flask import Blueprint, request, jsonify, send_file
from flask_login import login_required, current_user
from models import PermitApplication, Document, User
from extensions import db
from utils.serverless_optimized import serverless_report_generator
from utils.lightweight_imports import lightweight_importer
from io import BytesIO
import json

serverless_bp = Blueprint('serverless', __name__)

@serverless_bp.route('/applications/export/<format>')
@login_required
def export_applications(format):
    """Lightweight application export"""
    applications = PermitApplication.query.all()
    
    data = [{
        'id': app.id,
        'permit_number': app.permit_number,
        'applicant_name': app.applicant_name,
        'status': app.status,
        'created_at': app.created_at.isoformat() if app.created_at else None,
        'approved_at': app.approved_at.isoformat() if app.approved_at else None
    } for app in applications]
    
    if format == 'json':
        report = serverless_report_generator.generate_json_report(data, 'applications')
        return send_file(
            BytesIO(report.encode('utf-8')),
            mimetype='application/json',
            as_attachment=True,
            download_name='applications_export.json'
        )
    
    elif format == 'csv':
        headers = ['ID', 'Permit Number', 'Applicant Name', 'Status', 'Created At', 'Approved At']
        csv_data = [[
            app['id'], app['permit_number'], app['applicant_name'], 
            app['status'], app['created_at'], app['approved_at']
        ] for app in data]
        
        csv_report = serverless_report_generator.generate_csv_report(csv_data, headers)
        return send_file(
            BytesIO(csv_report.encode('utf-8')),
            mimetype='text/csv',
            as_attachment=True,
            download_name='applications_export.csv'
        )
    
    return jsonify({'error': 'Unsupported format'}), 400

@serverless_bp.route('/permits/<int:application_id>/generate')
@login_required
def generate_permit(application_id):
    """Lightweight permit generation"""
    application = PermitApplication.query.get_or_404(application_id)
    
    if application.status != 'Approved':
        return jsonify({'error': 'Application not approved'}), 400
    
    # Use lightweight PDF generator
    pdf_generator = lightweight_importer.get_pdf_generator()
    
    app_data = {
        'permit_number': application.permit_number,
        'applicant_name': application.applicant_name,
        'physical_address': application.physical_address,
        'num_boreholes': application.num_boreholes,
        'land_size': application.land_size,
        'gps_x': application.gps_x,
        'gps_y': application.gps_y,
        'water_allocation': application.water_allocation,
        'permit_type': application.permit_type,
        'approved_at': application.approved_at.strftime('%Y-%m-%d') if application.approved_at else None
    }
    
    pdf_content = pdf_generator.generate_permit_pdf(app_data)
    
    return send_file(
        BytesIO(pdf_content),
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f'Permit_{application.permit_number}.pdf'
    )

@serverless_bp.route('/stats/dashboard')
@login_required
def dashboard_stats():
    """Lightweight dashboard statistics"""
    stats = {
        'total_applications': PermitApplication.query.count(),
        'approved_applications': PermitApplication.query.filter_by(status='Approved').count(),
        'pending_applications': PermitApplication.query.filter(
            PermitApplication.status.in_(['Submitted', 'Under Review', 'Manager Reviewed'])
        ).count(),
        'rejected_applications': PermitApplication.query.filter_by(status='Rejected').count(),
        'total_users': User.query.count(),
        'total_documents': Document.query.count()
    }
    
    return jsonify(stats)
