from flask import Blueprint, request, jsonify
from ..services.employee_service import EmployeeService
from ..utils.security import jwt_required
from ..utils.db import query_db

employee_bp = Blueprint('employees', __name__, url_prefix='/api/employees')

@employee_bp.route('', methods=['GET'])
@jwt_required()
def get_employees():
    department_id = request.args.get('department_id', type=int)
    status = request.args.get('status')
    search = request.args.get('search')
    location = request.args.get('location')
    
    employees = EmployeeService.get_all_employees(department_id, status, search, location)
    return jsonify({'success': True, 'count': len(employees), 'employees': employees}), 200

@employee_bp.route('/<int:emp_id>', methods=['GET'])
@jwt_required()
def get_employee(emp_id):
    emp = EmployeeService.get_employee_by_id(emp_id)
    if not emp:
        return jsonify({'success': False, 'error': f'Employee with ID {emp_id} not found.'}), 404
    return jsonify({'success': True, 'employee': emp}), 200

@employee_bp.route('', methods=['POST'])
@jwt_required(roles=['ADMIN', 'SECURITY_OFFICER'])
def create_employee():
    data = request.get_json() or {}

    # Support full_name provided by UI
    if data.get('full_name') and not data.get('first_name'):
        parts = data['full_name'].strip().split(' ', 1)
        data['first_name'] = parts[0]
        data['last_name'] = parts[1] if len(parts) > 1 else ''

    # Auto-generate employee_code if missing
    if not data.get('employee_code'):
        max_id_row = query_db("SELECT id FROM employees ORDER BY id DESC LIMIT 1", one=True)
        next_num = 1000 + (max_id_row['id'] + 1 if max_id_row else 1)
        data['employee_code'] = f"EMP-{next_num}"

    # Auto-generate email if missing
    if not data.get('email'):
        fn = (data.get('first_name') or 'employee').lower()
        ln = (data.get('last_name') or '').lower()
        slug = f"{fn}.{ln}" if ln else f"{fn}{data.get('employee_code', '1000').replace('EMP-', '')}"
        data['email'] = f"{slug}@smartattend3d.io"

    # Auto-fill department_id if missing
    if not data.get('department_id'):
        first_dept = query_db("SELECT id FROM departments LIMIT 1", one=True)
        data['department_id'] = first_dept['id'] if first_dept else 1

    result = EmployeeService.create_employee(data)
    if not result.get('success'):
        return jsonify(result), 400
    return jsonify(result), 201

@employee_bp.route('/<int:emp_id>', methods=['PUT', 'PATCH'])
@jwt_required(roles=['ADMIN', 'SECURITY_OFFICER'])
def update_employee(emp_id):
    data = request.get_json() or {}
    result = EmployeeService.update_employee(emp_id, data)
    status_code = 200 if result.get('success') else 400
    return jsonify(result), status_code

@employee_bp.route('/<int:emp_id>', methods=['DELETE'])
@jwt_required(roles=['ADMIN'])
def delete_employee(emp_id):
    EmployeeService.delete_employee(emp_id)
    return jsonify({'success': True, 'message': f'Employee {emp_id} deleted successfully.'}), 200

@employee_bp.route('/<int:emp_id>/face', methods=['POST'])
@jwt_required(roles=['ADMIN', 'SECURITY_OFFICER'])
def register_face(emp_id):
    data = request.get_json() or {}
    image_base64 = data.get('image_base64')
    if not image_base64:
        return jsonify({'success': False, 'error': 'Missing image_base64 payload.'}), 400

    result = EmployeeService.register_face_biometrics(emp_id, image_base64)
    if not result.get('success'):
        return jsonify(result), 400
    return jsonify(result), 200

@employee_bp.route('/departments', methods=['GET'])
@jwt_required()
def get_departments():
    depts = query_db("""
        SELECT d.*, (SELECT COUNT(*) FROM employees WHERE department_id = d.id) as employee_count
        FROM departments d
        ORDER BY d.name ASC
    """)
    return jsonify({'success': True, 'departments': depts}), 200
