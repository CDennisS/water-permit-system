import pytest
from flask import url_for
from models import PermitApplication, Document, Comment

def test_create_application(auth_client):
    """Test creating a new application"""
    response = auth_client.post('/applications/new', data={
        'applicant_name': 'Test Applicant',
        'contact_number': '1234567890',
        'email': 'applicant@test.com',
        'physical_address': '123 Test St',
        'water_source': 'Test River',
        'water_use': 'Irrigation',
        'abstraction_volume': 100
    }, follow_redirects=True)
    assert response.status_code == 200
    assert b'Application submitted successfully' in response.data

def test_view_application(auth_client, test_application):
    """Test viewing an application"""
    response = auth_client.get(f'/applications/{test_application.id}')
    assert response.status_code == 200
    assert b'Test Applicant' in response.data

def test_update_application(auth_client, test_application):
    """Test updating an application"""
    response = auth_client.post(f'/applications/{test_application.id}/edit', data={
        'applicant_name': 'Updated Applicant',
        'contact_number': '0987654321',
        'email': 'updated@test.com',
        'physical_address': '456 Test St',
        'water_source': 'Updated River',
        'water_use': 'Domestic',
        'abstraction_volume': 200
    }, follow_redirects=True)
    assert response.status_code == 200
    assert b'Application updated successfully' in response.data

def test_upload_document(auth_client, test_application):
    """Test uploading a document"""
    data = {
        'document_type': 'Technical Report',
        'file': (b'Test file content', 'test.pdf')
    }
    response = auth_client.post(
        f'/applications/{test_application.id}/documents/upload',
        data=data,
        content_type='multipart/form-data',
        follow_redirects=True
    )
    assert response.status_code == 200
    assert b'Document uploaded successfully' in response.data

def test_add_comment(auth_client, test_application):
    """Test adding a comment"""
    response = auth_client.post(f'/applications/{test_application.id}/comments/add', data={
        'content': 'Test comment'
    }, follow_redirects=True)
    assert response.status_code == 200
    assert b'Comment added successfully' in response.data

def test_application_workflow(auth_client, test_application):
    """Test application workflow transitions"""
    # Test approval by chairperson
    response = auth_client.post(f'/applications/{test_application.id}/approve', follow_redirects=True)
    assert response.status_code == 200
    assert b'Application approved' in response.data

    # Test rejection
    response = auth_client.post(f'/applications/{test_application.id}/reject', data={
        'reason': 'Incomplete information'
    }, follow_redirects=True)
    assert response.status_code == 200
    assert b'Application rejected' in response.data
