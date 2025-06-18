import pytest
from flask import url_for
from models import ActivityLog
from datetime import datetime, timedelta

def test_view_activity_logs(auth_client):
    """Test viewing activity logs"""
    response = auth_client.get('/activity-logs')
    assert response.status_code == 200
    assert b'Activity Logs' in response.data

def test_filter_activity_logs(auth_client):
    """Test filtering activity logs"""
    # Test date range filter
    response = auth_client.get('/activity-logs?start_date=2024-01-01&end_date=2024-12-31')
    assert response.status_code == 200

    # Test action type filter
    response = auth_client.get('/activity-logs?action=create')
    assert response.status_code == 200

    # Test user role filter
    response = auth_client.get('/activity-logs?role=Permitting Officer')
    assert response.status_code == 200

def test_export_activity_logs(auth_client):
    """Test exporting activity logs"""
    # Test CSV export
    response = auth_client.get('/activity-logs/export/csv')
    assert response.status_code == 200
    assert response.mimetype == 'text/csv'

    # Test Excel export
    response = auth_client.get('/activity-logs/export/excel')
    assert response.status_code == 200
    assert response.mimetype == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

    # Test JSON export
    response = auth_client.get('/activity-logs/export/json')
    assert response.status_code == 200
    assert response.mimetype == 'application/json'

def test_activity_logs_statistics(auth_client):
    """Test activity logs statistics"""
    response = auth_client.get('/activity-logs/stats')
    assert response.status_code == 200
    assert b'Statistics' in response.data

def test_activity_log_creation(auth_client, test_application):
    """Test activity log creation"""
    # Create a test activity
    response = auth_client.post(f'/applications/{test_application.id}/edit', data={
        'applicant_name': 'Updated Applicant'
    }, follow_redirects=True)
    
    # Check if activity log was created
    log = ActivityLog.query.filter_by(
        application_id=test_application.id,
        action='edit'
    ).first()
    assert log is not None
    assert log.details == 'Application details updated' 