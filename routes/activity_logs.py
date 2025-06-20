from flask import Blueprint, render_template, request, redirect, url_for, flash, send_file
from flask_login import login_required, current_user
from models import ActivityLog, User, PermitApplication
from extensions import db
from datetime import datetime, timedelta
from utils.dynamic_imports import requires_pandas, requires_excel, importer
from utils.permissions import check_permission
from sqlalchemy import func, extract, desc
import json
from io import BytesIO, StringIO
import csv

logs_bp = Blueprint('logs', __name__)

@logs_bp.route('/')
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

@logs_bp.route('/stats')
@login_required
@check_permission(allowed_roles=['ICT', 'Permit Supervisor'])
def activity_logs_stats():
    # Get comprehensive statistics
    stats = get_activity_stats()
    return render_template('activity_logs_stats.html', stats=stats)

@requires_pandas
def get_activity_stats():
    """Get activity statistics using pandas"""
    pd = importer.get_pandas()
    
    # Get date range
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)
    
    # Get filter parameters
    start_date = request.args.get('start_date', start_date.strftime('%Y-%m-%d'))
    end_date = request.args.get('end_date', end_date.strftime('%Y-%m-%d'))
    
    # Convert to datetime
    start_date = datetime.strptime(start_date, '%Y-%m-%d')
    end_date = datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=1)

    # Get activity data
    activities = ActivityLog.query.join(User).filter(
        ActivityLog.timestamp.between(start_date, end_date)
    ).all()
    
    data = [{
        'action': log.action,
        'user_role': log.user.role,
        'timestamp': log.timestamp,
        'hour': log.timestamp.hour,
        'weekday': log.timestamp.weekday()
    } for log in activities]
    
    df = pd.DataFrame(data)
    
    if not df.empty:
        return {
            'total_actions': len(df),
            'actions_by_type': df['action'].value_counts().to_dict(),
            'actions_by_role': df['user_role'].value_counts().to_dict(),
            'actions_by_hour': df['hour'].value_counts().to_dict(),
            'actions_by_weekday': df['weekday'].value_counts().to_dict(),
            'most_active_users': get_most_active_users(start_date, end_date)
        }
    
    return {}

def get_most_active_users(start_date, end_date):
    """Get most active users"""
    return db.session.query(
        User.username,
        User.role,
        func.count(ActivityLog.id).label('action_count')
    ).join(ActivityLog).filter(
        ActivityLog.timestamp.between(start_date, end_date)
    ).group_by(User.id).order_by(desc('action_count')).limit(10).all()

@logs_bp.route('/export/<format>')
@login_required
@check_permission(allowed_roles=['ICT', 'Permit Supervisor'])
def export_logs(format):
    """Export activity logs"""
    # Get filter parameters
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    action = request.args.get('action')
    role = request.args.get('role')

    # Build query
    query = ActivityLog.query.join(User).join(PermitApplication)

    if start_date:
        query = query.filter(ActivityLog.timestamp >= datetime.strptime(start_date, '%Y-%m-%d'))
    if end_date:
        query = query.filter(ActivityLog.timestamp <= datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=1))
    if action:
        query = query.filter(ActivityLog.action == action)
    if role:
        query = query.filter(User.role == role)

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

    if format == 'csv':
        return export_logs_csv(data)
    elif format == 'excel':
        return export_logs_excel(data)
    elif format == 'json':
        return export_logs_json(data)

def export_logs_csv(data):
    """Export logs as CSV"""
    si = StringIO()
    cw = csv.writer(si)
    
    if data:
        cw.writerow(['Timestamp', 'Application', 'User', 'Role', 'Action', 'Details'])
        for log in data:
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
        BytesIO(output.encode('utf-8')),
        mimetype='text/csv',
        as_attachment=True,
        download_name=f'activity_logs_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
    )

@requires_excel
def export_logs_excel(data):
    """Export logs as Excel"""
    pd = importer.get_pandas()
    
    df = pd.DataFrame(data)
    
    output = BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        df.to_excel(writer, sheet_name='Activity Logs', index=False)
        
        workbook = writer.book
        worksheet = writer.sheets['Activity Logs']
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
        download_name=f'activity_logs_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
    )

def export_logs_json(data):
    """Export logs as JSON"""
    output = json.dumps(data, indent=2)
    
    return send_file(
        BytesIO(output.encode('utf-8')),
        mimetype='application/json',
        as_attachment=True,
        download_name=f'activity_logs_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
    )
