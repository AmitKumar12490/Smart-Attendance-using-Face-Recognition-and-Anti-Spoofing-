import datetime
from flask import Blueprint, request, jsonify, g
from ..services.attendance_service import AttendanceService
from ..utils.security import jwt_required
from ..utils.db import query_db, execute_db

attendance_bp = Blueprint('attendance', __name__, url_prefix='/api/attendance')

@attendance_bp.route('/mark', methods=['POST'])
def mark_attendance():
    """
    Public / Terminal endpoint for marking attendance using live camera face capture.
    Handles anti-spoofing, face recognition, and database records.
    """
    data = request.get_json() or {}
    image_base64 = data.get('image_base64')
    mode = data.get('mode', 'CHECK_IN')
    mock_spoof_mode = data.get('mock_spoof_mode')
    device_name = data.get('device_name', 'Main Gate Scanner Terminal #1')
    location = data.get('location', 'HQ Smart Entry Portal')

    if not image_base64:
        return jsonify({'success': False, 'error': 'Missing camera snapshot (image_base64).'}), 400

    result = AttendanceService.process_biometric_attendance(
        image_base64=image_base64,
        mode=mode,
        mock_spoof_mode=mock_spoof_mode,
        device_name=device_name,
        device_ip=request.remote_addr or "127.0.0.1",
        location=location
    )

    status_code = 200 if result.get('success') else (403 if result.get('status') == 'SPOOF_DETECTED' else 400)
    return jsonify(result), status_code

@attendance_bp.route('', methods=['GET'])
@jwt_required()
def get_attendance():
    """Fetches attendance log records with multi-criteria filters."""
    date = request.args.get('date')
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    department_id = request.args.get('department_id', type=int)
    status = request.args.get('status')
    location = request.args.get('location')
    employee_id = request.args.get('employee_id', type=int)
    limit = request.args.get('limit', default=100, type=int)

    # If employee role, restrict to their own records
    if g.current_user.get('role') == 'EMPLOYEE' and g.current_user.get('employee_id'):
        employee_id = g.current_user['employee_id']

    logs = AttendanceService.get_attendance_logs(
        date_from=date_from,
        date_to=date_to,
        department_id=department_id,
        status=status,
        employee_id=employee_id,
        location=location,
        date=date,
        limit=limit
    )

    return jsonify({'success': True, 'count': len(logs), 'attendance': logs}), 200

@attendance_bp.route('/today', methods=['GET'])
@jwt_required()
def get_today_attendance():
    """Fetches today's live workplace attendance dashboard status."""
    today_str = datetime.date.today().strftime("%Y-%m-%d")
    
    logs = query_db("""
        SELECT a.*, e.employee_code, e.first_name, e.last_name, e.profile_photo_url,
               e.designation, d.name as department_name
        FROM attendance a
        JOIN employees e ON a.employee_id = e.id
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE a.date = ?
        ORDER BY a.check_in_time DESC
    """, (today_str,))
    
    for log in logs:
        log['full_name'] = f"{log['first_name']} {log['last_name']}".strip()

    return jsonify({'success': True, 'date': today_str, 'count': len(logs), 'attendance': logs}), 200

@attendance_bp.route('/employee/<int:emp_id>', methods=['GET'])
@jwt_required()
def get_employee_attendance(emp_id):
    """Fetches full attendance history for a single employee."""
    logs = query_db("""
        SELECT * FROM attendance
        WHERE employee_id = ?
        ORDER BY date DESC
    """, (emp_id,))
    return jsonify({'success': True, 'employee_id': emp_id, 'attendance': logs}), 200
