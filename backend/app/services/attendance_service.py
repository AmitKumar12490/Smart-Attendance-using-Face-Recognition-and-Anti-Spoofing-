import datetime
import cv2
from typing import Dict, Any, List, Optional
from ..utils.db import query_db, execute_db
from ..utils.helpers import parse_base64_image, is_arrival_late, calculate_time_diff_hours
from ..ai.face_detection import detector
from ..ai.anti_spoofing import anti_spoof_engine
from ..ai.face_embedding import embedding_generator
from ..ai.face_recognition import face_matcher
from ..config import Config

class AttendanceService:
    @staticmethod
    def process_biometric_attendance(
        image_base64: str,
        mode: str = "CHECK_IN", # 'CHECK_IN', 'CHECK_OUT', 'AUTO'
        mock_spoof_mode: Optional[str] = None,
        device_name: str = "Terminal Kiosk #1",
        device_ip: str = "127.0.0.1",
        location: str = "Main Security Portal"
    ) -> Dict[str, Any]:
        """
        Executes the entire end-to-end facial recognition & anti-spoofing pipeline:
        1. Parse frame
        2. Detect Face
        3. Multi-cue Anti-Spoofing & Liveness Test
        4. Biometric Embedding Extraction
        5. Database Cosine Match
        6. Attendance Check-in/Check-out State Update
        7. Security Audit Logging on failure / spoofing
        """
        now = datetime.datetime.now()
        today_str = now.strftime("%Y-%m-%d")
        now_str = now.strftime("%Y-%m-%d %H:%M:%S")

        # Step 1: Decode Frame
        img = parse_base64_image(image_base64)
        if img is None:
            return {
                'success': False,
                'status': 'ERROR',
                'stage': 'IMAGE_DECODE',
                'error': 'Invalid image buffer received from camera stream.'
            }

        # Step 2: Detect Face
        faces = detector.detect_faces(img)
        if not faces:
            return {
                'success': False,
                'status': 'NO_FACE_DETECTED',
                'stage': 'FACE_DETECTION',
                'error': 'No face detected in video stream. Please align your face inside the bounding guide.'
            }

        # If multiple faces detected, determine if one is the primary center subject
        face_meta = faces[0]
        if len(faces) > 1:
            second_face = faces[1]
            # Check if two people are both competing in center
            if (face_meta.get('norm_center_dist', 0.5) < 0.35 and 
                second_face.get('norm_center_dist', 0.5) < 0.35 and 
                second_face.get('area', 0) > 0.7 * face_meta.get('area', 1)):
                return {
                    'success': False,
                    'status': 'MULTIPLE_FACES',
                    'stage': 'FACE_DETECTION',
                    'error': 'Multiple people detected in verification frame. Please ensure only one person is centered at a time.'
                }
            # Otherwise, faces[0] is the primary subject in the kiosk center reticle

        face_crop = detector.extract_face_crop(img, face_meta['box'])
        if face_crop is None:
            return {
                'success': False,
                'status': 'CROPPING_FAILED',
                'stage': 'FACE_DETECTION',
                'error': 'Unable to crop facial landmarks with sufficient contrast.'
            }

        # Step 3: Anti-Spoofing & Liveness Test
        liveness_result = anti_spoof_engine.analyze_liveness(
            face_crop=face_crop,
            mock_spoof_mode=mock_spoof_mode,
            custom_threshold=Config.ANTI_SPOOFING_THRESHOLD
        )

        if not liveness_result['is_real']:
            # Log Critical Security Incident
            attack_vec = liveness_result.get('attack_vector', 'Spoof Attempt')
            execute_db("""
                INSERT INTO security_events (
                    event_type, severity, attempted_employee_id, confidence_score,
                    liveness_score, attack_vector, device_ip, device_name,
                    location_label, description, created_at
                ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                'SPOOF_ATTEMPT_BLOCKED',
                'HIGH',
                liveness_result.get('confidence', 0.9),
                liveness_result.get('liveness_score', 0.2),
                attack_vec,
                device_ip,
                device_name,
                location,
                f"Anti-spoofing alert: {liveness_result.get('description')}",
                now_str
            ))

            return {
                'success': False,
                'status': 'SPOOF_DETECTED',
                'stage': 'LIVENESS_CHECK',
                'error': f'Security Alert: Liveness verification failed! Attack vector detected: {attack_vec}.',
                'liveness_score': liveness_result['liveness_score'],
                'attack_vector': attack_vec,
                'cues': liveness_result.get('cues', {})
            }

        # Step 4: Extract Deep SFace Embedding with Landmark Alignment
        raw_face = face_meta.get('raw_face')
        probe_embedding = embedding_generator.generate_embedding(img, raw_face=raw_face)

        # Step 5: Database Cosine Matching using SFace Deep Neural Network
        match_result = face_matcher.match_face(
            probe_embedding=probe_embedding,
            custom_threshold=0.380
        )

        if not match_result['matched']:
            # Log Unknown Identity Incident
            execute_db("""
                INSERT INTO security_events (
                    event_type, severity, attempted_employee_id, confidence_score,
                    liveness_score, attack_vector, device_ip, device_name,
                    location_label, description, created_at
                ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                'UNKNOWN_FACE_REJECTED',
                'MEDIUM',
                match_result.get('confidence', 0.0),
                liveness_result['liveness_score'],
                'Unregistered Biometric Probe',
                device_ip,
                device_name,
                location,
                'Unrecognized face tried to verify attendance.',
                now_str
            ))

            return {
                'success': False,
                'status': 'IDENTITY_NOT_FOUND',
                'stage': 'FACE_RECOGNITION',
                'error': 'Face not recognized in employee database. Please register your biometric profile with Admin.',
                'confidence': match_result['confidence'],
                'liveness_score': liveness_result['liveness_score']
            }

        # Step 6: Mark Attendance
        emp_id = match_result['employee_id']
        emp = match_result['employee']

        # Check existing attendance today
        existing_log = query_db("SELECT * FROM attendance WHERE employee_id = ? AND date = ?", (emp_id, today_str), one=True)

        if existing_log:
            if mode == 'CHECK_IN' and existing_log['check_in_time'] and not existing_log['check_out_time']:
                return {
                    'success': True,
                    'already_checked_in': True,
                    'status': 'ALREADY_CHECKED_IN',
                    'stage': 'ATTENDANCE_RECORDED',
                    'message': f"Welcome back {emp['full_name']}! You have already checked in today at {str(existing_log['check_in_time'])[11:16]}.",
                    'employee': emp,
                    'attendance': existing_log,
                    'confidence': match_result['confidence'],
                    'liveness_score': liveness_result['liveness_score']
                }
            
            # Execute Check-Out
            check_in_time_val = existing_log['check_in_time']
            hours = calculate_time_diff_hours(check_in_time_val, now_str)
            execute_db("""
                UPDATE attendance SET
                    check_out_time = ?,
                    work_hours = ?,
                    updated_at = ?
                WHERE id = ?
            """, (now_str, hours, now_str, existing_log['id']))

            updated_log = query_db("SELECT * FROM attendance WHERE id = ?", (existing_log['id'],), one=True)
            return {
                'success': True,
                'status': 'CHECKED_OUT_SUCCESS',
                'stage': 'ATTENDANCE_RECORDED',
                'message': f"Goodbye {emp['full_name']}! Check-out logged successfully. Shift duration: {hours} hrs.",
                'employee': emp,
                'attendance': updated_log,
                'confidence': match_result['confidence'],
                'liveness_score': liveness_result['liveness_score']
            }

        # New Check-in
        # Determine Late Status based on shift time
        emp_record = query_db("SELECT shift_start_time FROM employees WHERE id = ?", (emp_id,), one=True)
        shift_start = emp_record['shift_start_time'] if emp_record and emp_record['shift_start_time'] else Config.OFFICE_START_TIME
        is_late = is_arrival_late(now, shift_start_str=shift_start, grace_mins=Config.LATE_GRACE_PERIOD_MINUTES)
        att_status = 'LATE' if is_late else 'PRESENT'

        att_id = execute_db("""
            INSERT INTO attendance (
                employee_id, date, check_in_time, status,
                recognition_confidence, liveness_score, is_spoof_prevented,
                verification_mode, device_ip, device_name, location_label,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, 1, 'FACE_BIOMETRIC_3D', ?, ?, ?, ?, ?)
        """, (
            emp_id,
            today_str,
            now_str,
            att_status,
            match_result['confidence'],
            liveness_result['liveness_score'],
            device_ip,
            device_name,
            location,
            now_str,
            now_str
        ), return_id=True)

        new_log = query_db("SELECT * FROM attendance WHERE id = ?", (att_id,), one=True)

        return {
            'success': True,
            'status': 'CHECKED_IN_SUCCESS',
            'stage': 'ATTENDANCE_RECORDED',
            'is_late': is_late,
            'message': f"Access Granted! Identity verified. Attendance marked as {att_status}.",
            'employee': emp,
            'attendance': new_log,
            'confidence': match_result['confidence'],
            'liveness_score': liveness_result['liveness_score'],
            'cues': liveness_result.get('cues', {})
        }

    @staticmethod
    def get_attendance_logs(
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        department_id: Optional[int] = None,
        status: Optional[str] = None,
        employee_id: Optional[int] = None,
        location: Optional[str] = None,
        date: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        query = """
            SELECT a.*, e.employee_code, e.first_name, e.last_name, e.email,
                   e.designation, e.location, e.profile_photo_url, d.name as department_name
            FROM attendance a
            JOIN employees e ON a.employee_id = e.id
            LEFT JOIN departments d ON e.department_id = d.id
            WHERE 1=1
        """
        params = []
        if date:
            query += " AND a.date = ?"
            params.append(date)
        if date_from:
            query += " AND a.date >= ?"
            params.append(date_from)
        if date_to:
            query += " AND a.date <= ?"
            params.append(date_to)
        if department_id:
            query += " AND e.department_id = ?"
            params.append(department_id)
        if status:
            query += " AND a.status = ?"
            params.append(status.upper())
        if location:
            query += " AND e.location = ?"
            params.append(location)
        if employee_id:
            query += " AND a.employee_id = ?"
            params.append(employee_id)

        query += f" ORDER BY a.date DESC, a.check_in_time DESC LIMIT {int(limit)}"
        rows = query_db(query, tuple(params))
        for row in rows:
            row['full_name'] = f"{row['first_name']} {row['last_name']}".strip()
        return rows
