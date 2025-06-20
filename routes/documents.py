from flask import Blueprint, render_template, request, redirect, url_for, flash, send_file
from flask_login import login_required, current_user
from models import Document, PermitApplication, ActivityLog
from extensions import db
from datetime import datetime
from utils.file_handler import FileHandler
from utils.permissions import check_permission
import os

documents_bp = Blueprint('documents', __name__)

@documents_bp.route('/<int:application_id>')
@login_required
def view_documents(application_id):
    application = PermitApplication.query.get_or_404(application_id)
    
    # Check permissions
    if current_user.role == 'Permitting Officer' and application.created_by != current_user.id:
        flash('You can only view documents for your own applications.')
        return redirect(url_for('applications.dashboard'))
    
    # Group documents by category
    document_categories = {
        'Required Documents': ['ID Copy', 'Proof of Residence', 'Proof of Ownership'],
        'Technical Documents': ['Borehole Certificate', 'Capacity Test', 'Water Quality Test'],
        'Additional Documents': ['Other']
    }
    
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

@documents_bp.route('/<int:application_id>/upload', methods=['POST'])
@login_required
def upload_document(application_id):
    application = PermitApplication.query.get_or_404(application_id)
    
    # Check permissions
    if current_user.role == 'Permitting Officer' and application.status != 'Unsubmitted':
        flash('Documents can only be uploaded for unsubmitted applications.')
        return redirect(url_for('documents.view_documents', application_id=application_id))
    
    if 'document' not in request.files:
        flash('No document selected.')
        return redirect(url_for('documents.view_documents', application_id=application_id))
    
    file = request.files['document']
    if file.filename == '':
        flash('No document selected.')
        return redirect(url_for('documents.view_documents', application_id=application_id))
    
    # Use file handler for processing
    file_handler = FileHandler()
    
    try:
        # Process and save file
        file_info = file_handler.save_file(file, application_id, request.form.get('document_type'))
        
        # Create document record
        document = Document(
            application_id=application_id,
            document_type=request.form.get('document_type'),
            original_filename=file_info['original_filename'],
            file_path=file_info['file_path'],
            file_hash=file_info['file_hash'],
            file_size=file_info['file_size'],
            uploaded_by=current_user.id,
            uploaded_at=datetime.now()
        )
        db.session.add(document)
        
        # Log the action
        log = ActivityLog(
            application_id=application.id,
            user_id=current_user.id,
            action='Document Uploaded',
            details=f'Document {file_info["original_filename"]} uploaded by {current_user.username}'
        )
        db.session.add(log)
        db.session.commit()
        
        flash('Document uploaded successfully.')
    except Exception as e:
        flash(f'Error uploading document: {str(e)}')
    
    return redirect(url_for('documents.view_documents', application_id=application_id))

@documents_bp.route('/view/<int:document_id>')
@login_required
def view_document(document_id):
    document = Document.query.get_or_404(document_id)
    application = document.application
    
    # Check permissions
    if current_user.role == 'Permitting Officer' and application.created_by != current_user.id:
        flash('You can only view documents for your own applications.')
        return redirect(url_for('applications.dashboard'))
    
    # Log document view
    log = ActivityLog(
        application_id=application.id,
        user_id=current_user.id,
        action='Document Viewed',
        details=f'Document {document.original_filename} viewed by {current_user.username}'
    )
    db.session.add(log)
    db.session.commit()
    
    return send_file(document.file_path)

@documents_bp.route('/delete/<int:document_id>', methods=['POST'])
@login_required
def delete_document(document_id):
    document = Document.query.get_or_404(document_id)
    application = document.application
    
    # Check permissions
    if current_user.role not in ['ICT', 'Permit Supervisor'] and application.created_by != current_user.id:
        flash('You do not have permission to delete this document.')
        return redirect(url_for('documents.view_documents', application_id=application.id))
    
    try:
        # Delete file
        if os.path.exists(document.file_path):
            os.remove(document.file_path)
        
        # Log the action
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
    
    return redirect(url_for('documents.view_documents', application_id=application.id))
