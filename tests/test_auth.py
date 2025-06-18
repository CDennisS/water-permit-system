import pytest
from flask import url_for

def test_login_page(client):
    """Test login page loads correctly"""
    response = client.get('/login')
    assert response.status_code == 200
    assert b'Login' in response.data

def test_login_success(client):
    """Test successful login"""
    response = client.post('/login', data={
        'username': 'officer',
        'password': 'test123'
    }, follow_redirects=True)
    assert response.status_code == 200
    assert b'Welcome' in response.data

def test_login_invalid_credentials(client):
    """Test login with invalid credentials"""
    response = client.post('/login', data={
        'username': 'officer',
        'password': 'wrongpassword'
    }, follow_redirects=True)
    assert response.status_code == 200
    assert b'Invalid username or password' in response.data

def test_logout(auth_client):
    """Test logout functionality"""
    response = auth_client.get('/logout', follow_redirects=True)
    assert response.status_code == 200
    assert b'Login' in response.data

def test_unauthorized_access(client):
    """Test unauthorized access to protected routes"""
    response = client.get('/dashboard')
    assert response.status_code == 302  # Redirect to login
    assert '/login' in response.headers['Location'] 