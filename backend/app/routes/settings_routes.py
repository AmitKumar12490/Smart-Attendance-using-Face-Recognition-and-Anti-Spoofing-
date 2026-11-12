from flask import Blueprint, request, jsonify
from ..utils.db import query_db, execute_db
from ..utils.security import jwt_required

settings_bp = Blueprint('settings', __name__, url_prefix='/api/settings')

@settings_bp.route('', methods=['GET'])
@jwt_required()
def get_settings():
    settings_list = query_db("SELECT * FROM system_settings ORDER BY category, key")
    settings_dict = {s['key']: s['value'] for s in settings_list}
    return jsonify({
        'success': True,
        'settings': settings_dict,
        'detailed': settings_list
    }), 200

@settings_bp.route('', methods=['POST', 'PUT'])
@jwt_required(roles=['ADMIN'])
def update_settings():
    data = request.get_json() or {}
    for key, value in data.items():
        execute_db(
            """
            INSERT INTO system_settings (key, value, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
            """,
            (key, str(value))
        )
    return jsonify({'success': True, 'message': 'System configuration updated successfully.'}), 200
