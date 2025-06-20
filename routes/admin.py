from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user
from models import User
from extensions import db
from utils.permissions import check_permission

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/users')
@login_required
@check_permission(allowed_roles=['ICT', 'Permit Supervisor'])
def manage_users():
    users = User.query.all()
    return render_template('users.html', users=users)

@admin_bp.route('/users/new', methods=['GET', 'POST'])
@login_required
@check_permission(allowed_roles=['ICT', 'Permit Supervisor'])
def new_user():
    if request.method == 'POST':
        user = User(
            username=request.form['username'],
            role=request.form['role']
        )
        user.set_password(request.form['password'])
        db.session.add(user)
        db.session.commit()
        flash('User created successfully!')
        return redirect(url_for('admin.manage_users'))
    
    return render_template('new_user.html')

@admin_bp.route('/users/<int:user_id>/edit', methods=['GET', 'POST'])
@login_required
@check_permission(allowed_roles=['ICT', 'Permit Supervisor'])
def edit_user(user_id):
    user = User.query.get_or_404(user_id)
    
    if request.method == 'POST':
        user.username = request.form['username']
        user.role = request.form['role']
        
        if request.form.get('password'):
            user.set_password(request.form['password'])
        
        db.session.commit()
        flash('User updated successfully!')
        return redirect(url_for('admin.manage_users'))
    
    return render_template('edit_user.html', user=user)

@admin_bp.route('/users/<int:user_id>/toggle', methods=['POST'])
@login_required
@check_permission(allowed_roles=['ICT', 'Permit Supervisor'])
def toggle_user(user_id):
    user = User.query.get_or_404(user_id)
    user.is_active = not user.is_active
    db.session.commit()
    
    status = 'activated' if user.is_active else 'deactivated'
    flash(f'User {status} successfully!')
    return redirect(url_for('admin.manage_users'))
