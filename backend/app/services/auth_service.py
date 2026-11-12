import datetime
from typing import Dict, Any, Optional
from ..utils.db import query_db, execute_db
from ..utils.security import hash_password, verify_password, generate_jwt_token

class AuthService:
    @staticmethod
    def login(email: str, password: str) -> Dict[str, Any]:
        user = query_db("SELECT * FROM users WHERE email = ? AND is_active = 1", (email.strip().lower(),), one=True)
        if not user:
            return {'success': False, 'error': 'Invalid email credentials or account inactive.', 'status': 401}
            
        if not verify_password(password, user['password_hash']):
            return {'success': False, 'error': 'Invalid password credentials.', 'status': 401}

        # Check if user is linked to an employee profile
        emp = query_db("SELECT id, employee_code, department_id, designation, profile_photo_url FROM employees WHERE user_id = ? OR email = ?", (user['id'], user['email']), one=True)
        emp_id = emp['id'] if emp else None

        # Update last login
        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        execute_db("UPDATE users SET last_login = ? WHERE id = ?", (now_str, user['id']))

        token = generate_jwt_token(
            user_id=user['id'],
            email=user['email'],
            role=user['role'],
            full_name=user['full_name'],
            employee_id=emp_id
        )

        return {
            'success': True,
            'token': token,
            'user': {
                'id': user['id'],
                'email': user['email'],
                'full_name': user['full_name'],
                'role': user['role'],
                'employee_id': emp_id,
                'employee_code': emp['employee_code'] if emp else None,
                'designation': emp['designation'] if emp else None,
                'profile_photo_url': emp['profile_photo_url'] if emp else None
            }
        }

    @staticmethod
    def register(email: str, password: str, full_name: str, role: str = "EMPLOYEE") -> Dict[str, Any]:
        existing = query_db("SELECT id FROM users WHERE email = ?", (email.strip().lower(),), one=True)
        if existing:
            return {'success': False, 'error': 'An account with this email address already exists.', 'status': 409}

        pw_hash = hash_password(password)
        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        user_id = execute_db(
            """
            INSERT INTO users (email, password_hash, full_name, role, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, 1, ?, ?)
            """,
            (email.strip().lower(), pw_hash, full_name.strip(), role.upper(), now_str, now_str),
            return_id=True
        )

        token = generate_jwt_token(user_id=user_id, email=email, role=role.upper(), full_name=full_name)
        return {
            'success': True,
            'token': token,
            'user': {
                'id': user_id,
                'email': email.strip().lower(),
                'full_name': full_name.strip(),
                'role': role.upper()
            }
        }

    @staticmethod
    def get_user_profile(user_id: int) -> Optional[Dict[str, Any]]:
        user = query_db("SELECT id, email, full_name, role, is_active, last_login, created_at FROM users WHERE id = ?", (user_id,), one=True)
        if not user:
            return None
        emp = query_db("SELECT * FROM employees WHERE user_id = ? OR email = ?", (user['id'], user['email']), one=True)
        user['employee'] = emp
        return user
