import csv
import io
import datetime
from flask import Blueprint, request, jsonify, Response
from ..services.attendance_service import AttendanceService
from ..utils.db import query_db
from ..utils.security import jwt_required

report_bp = Blueprint('reports', __name__, url_prefix='/api/reports')

@report_bp.route('/attendance', methods=['GET'])
@jwt_required()
def generate_attendance_report():
    """Returns structured data ready for PDF compilation or tabular display."""
    date_from = request.args.get('date_from', (datetime.date.today() - datetime.timedelta(days=30)).strftime("%Y-%m-%d"))
    date_to = request.args.get('date_to', datetime.date.today().strftime("%Y-%m-%d"))
    department_id = request.args.get('department_id', type=int)

    logs = AttendanceService.get_attendance_logs(
        date_from=date_from,
        date_to=date_to,
        department_id=department_id,
        limit=500
    )

    # Summary statistics for this period
    total_logs = len(logs)
    present = sum(1 for l in logs if l['status'] == 'PRESENT')
    late = sum(1 for l in logs if l['status'] == 'LATE')
    avg_hours = round(sum(l['work_hours'] or 0.0 for l in logs) / total_logs, 1) if total_logs > 0 else 0.0

    return jsonify({
        'success': True,
        'period': {'date_from': date_from, 'date_to': date_to},
        'summary': {
            'total_records': total_logs,
            'present_count': present,
            'late_count': late,
            'average_hours': avg_hours
        },
        'records': logs
    }), 200

@report_bp.route('/export-csv', methods=['GET'])
@jwt_required()
def export_attendance_csv():
    """Generates and downloads a CSV spreadsheet of attendance records."""
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    department_id = request.args.get('department_id', type=int)

    logs = AttendanceService.get_attendance_logs(
        date_from=date_from,
        date_to=date_to,
        department_id=department_id,
        limit=2000
    )

    output = io.StringIO()
    writer = csv.writer(output)
    
    # Headers
    writer.writerow([
        'Log ID', 'Employee Code', 'Full Name', 'Department', 'Designation',
        'Date', 'Check In Time', 'Check Out Time', 'Status', 'Work Hours',
        'Recognition Confidence', 'Liveness Score', 'Device / Terminal'
    ])

    for log in logs:
        writer.writerow([
            log['id'],
            log.get('employee_code', ''),
            log.get('full_name', ''),
            log.get('department_name', ''),
            log.get('designation', ''),
            log.get('date', ''),
            log.get('check_in_time', ''),
            log.get('check_out_time', ''),
            log.get('status', ''),
            log.get('work_hours', 0.0),
            log.get('recognition_confidence', 0.0),
            log.get('liveness_score', 0.0),
            log.get('device_name', '')
        ])

    csv_data = output.getvalue()
    filename = f"SmartAttend_Report_{datetime.date.today().strftime('%Y%m%d')}.csv"

    return Response(
        csv_data,
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
