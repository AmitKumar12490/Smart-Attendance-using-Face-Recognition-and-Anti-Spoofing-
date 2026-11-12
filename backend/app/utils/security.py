import datetime
import functools
import jwt
import bcrypt
from flask import request, jsonify, g
from ..config import Config

def hash_password(password: str) -> str:
    """Hashes a plaintext password using bcrypt."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plaintext password against a stored bcrypt hash."""
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def generate_jwt_token(user_id: int, email: str, role: str, full_name: str, employee_id: int = None) -> str:
    """Generates a secure JSON Web Token for the user."""
    payload = {
        'sub': user_id,
        'email': email,
        'role': role,
        'name': full_name,
        'employee_id': employee_id,
        'iat': datetime.datetime.now(datetime.timezone.utc),
        'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=Config.JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, Config.JWT_SECRET_KEY, algorithm='HS256')

def decode_jwt_token(token: str):
    """Decodes and validates a JWT token."""
    try:
        return jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def jwt_required(roles=None):
    """
    Decorator for endpoints requiring JWT authentication and optional Role checking.
    Example: @jwt_required(roles=['ADMIN', 'SECURITY_OFFICER'])
    """
    def decorator(f):
        @functools.wraps(f)
        def wrapper(*args, **kwargs):
            auth_header = request.headers.get('Authorization', None)
            token = None
            if auth_header and auth_header.startswith('Bearer '):
                token = auth_header.split(' ', 1)[1]
            elif request.args.get('token'):
                token = request.args.get('token')

            if not token:
                return jsonify({
                    'success': False,
                    'error': 'Missing or malformed Authorization header. Bearer token required.'
                }), 401
                
            payload = decode_jwt_token(token)
            if not payload:
                return jsonify({
                    'success': False,
                    'error': 'Invalid, tampered, or expired authorization token.'
                }), 401
                
            if roles:
                user_role = payload.get('role', 'EMPLOYEE')
                allowed_roles = roles if isinstance(roles, list) else [roles]
                if user_role not in allowed_roles:
                    return jsonify({
                        'success': False,
                        'error': f'Forbidden: Insufficient privileges for role {user_role}.'
                    }), 403
                    
            g.current_user = payload
            return f(*args, **kwargs)
        return wrapper
    return decorator
