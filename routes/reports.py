from flask import Blueprint, render_template, request, redirect, url_for, flash, send_file, jsonify
from flask_login import login_required, current_user
from models import PermitApplication, ActivityLog, Document, Comment, User
from extensions import db
from datetime import datetime, timedelta
from utils.dynamic_imports import requires_pandas, requires_excel, requires_pdf, importer
from utils.permissions import check_permission
from sqlalchemy import func, extract, desc
import json
from io import BytesIO, StringIO
import csv

reports_bp = Blueprint('reports', __name__)

@reports_bp.route('/')
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

@reports_bp.route('/export/<format>')
@login_required
@check_permission(allowed_roles=['ICT', 'Permit Supervisor'])
def export_data(format):
    """Export data in various formats using dynamic imports"""
    
    # Get filter parameters
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    status = request.args.get('status')
    permit_type = request.args.get('permit_type')
    
    # Build query
    query = PermitApplication.query
    
    if start_date:
        query = query.filter(PermitApplication.created_at >= datetime.strptime(start_date, '%Y-%m-%d'))
    if end_date:
        query = query.filter(PermitApplication.created_at <= datetime.strptime(end_date, '%Y-%m-%d'))
    if status:
        query = query.filter(PermitApplication.status == status)
    if permit_type:
        query = query.filter(PermitApplication.permit_type == permit_type)
    
    applications = query.all()
    
    # Prepare data
    data = [{
        'permit_number': app.permit_number,
        'applicant_name': app.applicant_name,
        'physical_address': app.physical_address,
        'permit_type': app.permit_type,
        'water_source': app.water_source,
        'status': app.status,
        'created_at': app.created_at.strftime('%Y-%m-%d %H:%M:%S'),
        'submitted_at': app.submitted_at.strftime('%Y-%m-%d %H:%M:%S') if app.submitted_at else '',
        'approved_at': app.approved_at.strftime('%Y-%m-%d %H:%M:%S') if app.approved_at else ''
    } for app in applications]
    
    if format == 'csv':
        return export_csv(data)
    elif format == 'excel':
        return export_excel(data)
    elif format == 'json':
        return export_json(data)
    else:
        flash('Invalid export format')
        return redirect(url_for('reports.reports'))

def export_csv(data):
    """Export data as CSV"""
    si = StringIO()
    cw = csv.writer(si)
    
    if data:
        # Write headers
        cw.writerow(data[0].keys())
        # Write data
        for row in data:
            cw.writerow(row.values())
    
    output = si.getvalue()
    si.close()
    
    return send_file(
        BytesIO(output.encode('utf-8')),
        mimetype='text/csv',
        as_attachment=True,
        download_name=f'applications_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
    )

@requires_excel
def export_excel(data):
    """Export data as Excel using dynamic imports"""
    pd = importer.get_pandas()
    
    # Create DataFrame
    df = pd.DataFrame(data)
    
    # Create Excel file in memory
    output = BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        df.to_excel(writer, sheet_name='Applications', index=False)
        
        # Get workbook and worksheet
        workbook = writer.book
        worksheet = writer.sheets['Applications']
        
        # Add formatting
        header_format = workbook.add_format({
            'bold': True,
            'bg_color': '#4e73df',
            'font_color': 'white'
        })
        worksheet.set_row(0, None, header_format)
    
    output.seek(0)
    
    return send_file(
        output,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name=f'applications_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
    )

def export_json(data):
    """Export data as JSON"""
    output = json.dumps(data, indent=2)
    
    return send_file(
        BytesIO(output.encode('utf-8')),
        mimetype='application/json',
        as_attachment=True,
        download_name=f'applications_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
    )

@reports_bp.route('/analytics')
@login_required
@check_permission(allowed_roles=['ICT', 'Permit Supervisor'])
def analytics():
    """Advanced analytics dashboard"""
    # Get comprehensive statistics
    stats = get_analytics_data()
    return render_template('analytics.html', stats=stats)

@requires_pandas
def get_analytics_data():
    """Get analytics data using pandas for complex calculations"""
    pd = importer.get_pandas()
    
    # Get all applications as DataFrame
    applications = PermitApplication.query.all()
    data = [{
        'id': app.id,
        'status': app.status,
        'permit_type': app.permit_type,
        'water_source': app.water_source,
        'created_at': app.created_at,
        'submitted_at': app.submitted_at,
        'approved_at': app.approved_at
    } for app in applications]
    
    df = pd.DataFrame(data)
    
    if not df.empty:
        # Calculate processing times
        df['processing_time'] = (df['approved_at'] - df['submitted_at']).dt.days
        
        # Monthly trends
        df['month'] = df['created_at'].dt.to_period('M')
        monthly_stats = df.groupby('month').size().to_dict()
        
        # Status distribution
        status_stats = df['status'].value_counts().to_dict()
        
        # Type distribution
        type_stats = df['permit_type'].value_counts().to_dict()
        
        return {
            'monthly_trends': monthly_stats,
            'status_distribution': status_stats,
            'type_distribution': type_stats,
            'avg_processing_time': df['processing_time'].mean(),
            'total_applications': len(df)
        }
    
    return {}
