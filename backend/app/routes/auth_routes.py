from flask import Blueprint, request, jsonify, g
from ..services.auth_service import AuthService
from ..utils.security import jwt_required

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'success': False, 'error': 'Email and password are required.'}), 400
        
    result = AuthService.login(email, password)
    if not result.get('success'):
        return jsonify(result), result.get('status', 401)
        
    return jsonify(result), 200

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')
    full_name = data.get('full_name')
    role = data.get('role', 'EMPLOYEE')

    if not email or not password or not full_name:
        return jsonify({'success': False, 'error': 'Missing required fields: email, password, full_name.'}), 400

    result = AuthService.register(email, password, full_name, role)
    if not result.get('success'):
        return jsonify(result), result.get('status', 400)

    return jsonify(result), 201

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    user = AuthService.get_user_profile(g.current_user['sub'])
    if not user:
        return jsonify({'success': False, 'error': 'User profile not found.'}), 404
    return jsonify({'success': True, 'user': user}), 200

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json() or {}
    email = data.get('email', '').strip()
    if not email:
        return jsonify({'success': False, 'error': 'Email is required.'}), 400
    return jsonify({
        'success': True,
        'message': f'If an account with {email} exists, password reset instructions have been dispatched.'
    }), 200
