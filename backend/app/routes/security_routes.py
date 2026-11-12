from flask import Blueprint, request, jsonify, g
from ..services.security_service import SecurityService
from ..utils.security import jwt_required

security_bp = Blueprint('security', __name__, url_prefix='/api/security')

@security_bp.route('/events', methods=['GET'])
@jwt_required()
def get_security_events():
    severity = request.args.get('severity')
    event_type = request.args.get('event_type')
    resolved = request.args.get('resolved')
    limit = request.args.get('limit', default=50, type=int)

    is_resolved = None
    if resolved is not None:
        is_resolved = resolved.lower() in ['true', '1', 'yes']

    events = SecurityService.get_security_events(
        severity=severity,
        event_type=event_type,
        resolved=is_resolved,
        limit=limit
    )

    return jsonify({'success': True, 'count': len(events), 'events': events}), 200

@security_bp.route('/events/<int:event_id>/resolve', methods=['POST', 'PUT'])
@jwt_required(roles=['ADMIN', 'SECURITY_OFFICER'])
def resolve_event(event_id):
    user_id = g.current_user['sub']
    SecurityService.resolve_event(event_id, user_id)
    return jsonify({'success': True, 'message': f'Security Incident #{event_id} marked as resolved.'}), 200

@security_bp.route('/summary', methods=['GET'])
@jwt_required()
def get_security_summary():
    summary = SecurityService.get_security_summary()
    return jsonify({'success': True, 'summary': summary}), 200
