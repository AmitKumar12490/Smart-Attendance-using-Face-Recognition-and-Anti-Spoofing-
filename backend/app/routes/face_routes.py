from flask import Blueprint, request, jsonify
from ..utils.helpers import parse_base64_image
from ..ai.face_detection import detector
from ..ai.anti_spoofing import anti_spoof_engine
from ..ai.face_embedding import embedding_generator
from ..ai.face_recognition import face_matcher
from ..services.employee_service import EmployeeService
from ..utils.security import jwt_required

face_bp = Blueprint('face', __name__, url_prefix='/api/face')

@face_bp.route('/detect', methods=['POST'])
def detect_face():
    """Analyzes an input frame for face presence, coordinates, and sharpness."""
    data = request.get_json() or {}
    image_base64 = data.get('image_base64')
    if not image_base64:
        return jsonify({'success': False, 'error': 'image_base64 is required.'}), 400

    img = parse_base64_image(image_base64)
    if img is None:
        return jsonify({'success': False, 'error': 'Invalid image encoding.'}), 400

    faces = detector.detect_faces(img)
    return jsonify({
        'success': True,
        'face_detected': len(faces) > 0,
        'count': len(faces),
        'faces': faces
    }), 200

@face_bp.route('/liveness', methods=['POST'])
def check_liveness():
    """Analyzes an input frame for real vs spoof liveness classification."""
    data = request.get_json() or {}
    image_base64 = data.get('image_base64')
    mock_mode = data.get('mock_spoof_mode')
    
    if not image_base64:
        return jsonify({'success': False, 'error': 'image_base64 is required.'}), 400

    img = parse_base64_image(image_base64)
    if img is None:
        return jsonify({'success': False, 'error': 'Invalid image encoding.'}), 400

    faces = detector.detect_faces(img)
    if not faces:
        return jsonify({'success': False, 'error': 'No face found in image.'}), 400

    face_crop = detector.extract_face_crop(img, faces[0]['box'])
    result = anti_spoof_engine.analyze_liveness(face_crop, mock_spoof_mode=mock_mode)

    return jsonify({'success': True, 'liveness': result}), 200

@face_bp.route('/verify', methods=['POST'])
def verify_face():
    """Runs complete verification on a probe face image against enrolled database."""
    data = request.get_json() or {}
    image_base64 = data.get('image_base64')
    mock_mode = data.get('mock_spoof_mode')

    if not image_base64:
        return jsonify({'success': False, 'error': 'image_base64 is required.'}), 400

    img = parse_base64_image(image_base64)
    if img is None:
        return jsonify({'success': False, 'error': 'Invalid image.'}), 400

    faces = detector.detect_faces(img)
    if not faces:
        return jsonify({'success': False, 'error': 'No face detected in stream.'}), 400

    face_crop = detector.extract_face_crop(img, faces[0]['box'])
    
    # Check Liveness
    liveness = anti_spoof_engine.analyze_liveness(face_crop, mock_spoof_mode=mock_mode)
    if not liveness['is_real']:
        return jsonify({
            'success': False,
            'status': 'SPOOF_DETECTED',
            'error': 'Anti-spoofing alert: Biometric signature rejected as presentation attack.',
            'liveness': liveness
        }), 403

    # Embedding & Match
    probe_emb = embedding_generator.generate_embedding(face_crop)
    match = face_matcher.match_face(probe_emb)

    return jsonify({
        'success': match['matched'],
        'status': 'VERIFIED' if match['matched'] else 'UNKNOWN_IDENTITY',
        'match': match,
        'liveness': liveness
    }), 200

@face_bp.route('/register', methods=['POST'])
@jwt_required(roles=['ADMIN', 'SECURITY_OFFICER'])
def register_face_direct():
    """Enrolls face biometrics for a given employee ID."""
    data = request.get_json() or {}
    emp_id = data.get('employee_id')
    image_base64 = data.get('image_base64')
    
    if not emp_id or not image_base64:
        return jsonify({'success': False, 'error': 'employee_id and image_base64 are required.'}), 400

    result = EmployeeService.register_face_biometrics(emp_id, image_base64)
    return jsonify(result), 200 if result.get('success') else 400
