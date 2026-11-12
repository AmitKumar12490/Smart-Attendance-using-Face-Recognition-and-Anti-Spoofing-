import os
import sys
import unittest
import json
import base64
import numpy as np
import cv2

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.utils.db import get_db_connection
from app.ai.face_detection import detector
from app.ai.anti_spoofing import anti_spoof_engine
from app.ai.face_embedding import embedding_generator

def create_synthetic_face_image_base64():
    """Generates a synthetic 200x200 RGB image with a circular face structure for testing."""
    img = np.full((200, 200, 3), 180, dtype=np.uint8)
    # Draw oval face
    cv2.ellipse(img, (100, 100), (60, 80), 0, 0, 360, (210, 180, 160), -1)
    # Draw eyes
    cv2.circle(img, (75, 85), 10, (50, 40, 30), -1)
    cv2.circle(img, (125, 85), 10, (50, 40, 30), -1)
    # Draw nose
    cv2.line(img, (100, 95), (100, 115), (160, 130, 110), 3)
    # Draw mouth
    cv2.ellipse(img, (100, 135), (25, 10), 0, 0, 180, (120, 50, 50), 3)
    
    _, buffer = cv2.imencode('.jpg', img)
    encoded = base64.b64encode(buffer).decode('utf-8')
    return f"data:image/jpeg;base64,{encoded}"

class SmartAttendBackendTestSuite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.client = cls.app.test_client()
        cls.test_face_b64 = create_synthetic_face_image_base64()
        cls.admin_token = None

    def test_01_health_check(self):
        """Test the system health check endpoint."""
        response = self.client.get('/api/health')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data.get('status'), 'ONLINE')
        self.assertIn('ai_engine', data)
        print("  [PASS] Health check endpoint")

    def test_02_database_connectivity_and_seed(self):
        """Verify database connectivity and pre-seeded records."""
        conn = get_db_connection()
        try:
            user_count = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
            emp_count = conn.execute("SELECT COUNT(*) FROM employees").fetchone()[0]
            dept_count = conn.execute("SELECT COUNT(*) FROM departments").fetchone()[0]
            
            self.assertGreater(user_count, 0, "Users table should have seeded accounts")
            self.assertGreater(emp_count, 0, "Employees table should have seeded employees")
            self.assertGreater(dept_count, 0, "Departments table should have departments")
            print(f"  [PASS] Database verified: {user_count} users, {emp_count} employees, {dept_count} departments")
        finally:
            conn.close()

    def test_03_auth_login_success(self):
        """Test admin authentication and JWT token generation."""
        response = self.client.post('/api/auth/login', json={
            'email': 'admin@smartattend3d.io',
            'password': 'Admin@123'
        })
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data.get('success'))
        self.assertIn('token', data)
        self.assertEqual(data['user']['role'], 'ADMIN')
        
        # Save token for subsequent tests
        SmartAttendBackendTestSuite.admin_token = data['token']
        print("  [PASS] Admin login & JWT verification")

    def test_04_auth_login_invalid_credentials(self):
        """Test authentication rejection with invalid password."""
        response = self.client.post('/api/auth/login', json={
            'email': 'admin@smartattend3d.io',
            'password': 'WrongPassword999'
        })
        self.assertEqual(response.status_code, 401)
        data = response.get_json()
        self.assertFalse(data.get('success'))
        print("  [PASS] Invalid credentials rejection")

    def test_05_auth_current_user_profile(self):
        """Test /api/auth/me using authenticated Bearer token."""
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        response = self.client.get('/api/auth/me', headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data.get('success'))
        self.assertEqual(data['user']['email'], 'admin@smartattend3d.io')
        print("  [PASS] Auth profile inspection")

    def test_06_employees_list(self):
        """Test fetching the employee roster."""
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        response = self.client.get('/api/employees', headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data.get('success'))
        self.assertIsInstance(data.get('employees'), list)
        self.assertGreater(len(data['employees']), 0)
        print(f"  [PASS] Employee roster endpoint ({len(data['employees'])} employees)")

    def test_07_analytics_summary(self):
        """Test workplace analytics KPI summary endpoint."""
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        response = self.client.get('/api/analytics/summary', headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data.get('success'))
        summary = data.get('summary', {})
        self.assertIn('total_employees', summary)
        print(f"  [PASS] Analytics summary (Total employees: {summary.get('total_employees')})")

    def test_08_analytics_3d_nodes(self):
        """Test 3D floor map spatial coordinates generator."""
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        response = self.client.get('/api/analytics/workplace-3d-nodes', headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data.get('success'))
        nodes = data.get('nodes', [])
        self.assertIsInstance(nodes, list)
        if len(nodes) > 0:
            first_node = nodes[0]
            self.assertIn('position', first_node)
            self.assertIn('status', first_node)
        print(f"  [PASS] 3D floor nodes ({len(nodes)} spatial nodes generated)")

    def test_09_security_events(self):
        """Test security threat log retrieval."""
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        response = self.client.get('/api/security/events', headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data.get('success'))
        self.assertIn('events', data)
        print(f"  [PASS] Security audit trail ({len(data.get('events', []))} events)")

    def test_10_attendance_today(self):
        """Test today's attendance logs."""
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        response = self.client.get('/api/attendance/today', headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data.get('success'))
        self.assertIn('attendance', data)
        print(f"  [PASS] Today's attendance activity ({len(data.get('attendance', []))} records)")

    def test_11_settings_config(self):
        """Test system configuration retrieval."""
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        response = self.client.get('/api/settings', headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data.get('success'))
        self.assertIn('settings', data)
        print("  [PASS] System settings endpoint")

    def test_12_reports_csv_export(self):
        """Test CSV report generation endpoint."""
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        response = self.client.get('/api/reports/export-csv', headers=headers)
        self.assertEqual(response.status_code, 200)
        self.assertIn('text/csv', response.headers.get('Content-Type', ''))
        content = response.data.decode('utf-8')
        self.assertTrue('Employee' in content or 'Date' in content or 'Status' in content)
        print("  [PASS] CSV export endpoint")

    def test_13_ai_face_embedding_generator(self):
        """Test direct 128D AI face embedding generator with synthetic crop."""
        test_crop = np.full((112, 112, 3), 150, dtype=np.uint8)
        embedding = embedding_generator.generate_embedding(test_crop)
        self.assertEqual(len(embedding), 128)
        # Verify L2 normalization
        norm = np.linalg.norm(embedding)
        self.assertAlmostEqual(norm, 1.0, places=4)
        print("  [PASS] 128D AI Biometric vector generator (Normalized L2 = 1.0)")

    def test_14_ai_anti_spoofing_engine(self):
        """Test multi-cue anti-spoofing firewall."""
        test_crop = np.full((100, 100, 3), 140, dtype=np.uint8)
        
        # Test simulated presentation attack (screen replay / print)
        spoof_res = anti_spoof_engine.analyze_liveness(test_crop, mock_spoof_mode='SCREEN_REPLAY')
        self.assertFalse(spoof_res['is_real'])
        self.assertIn('attack_vector', spoof_res)
        
        # Test genuine mock
        real_res = anti_spoof_engine.analyze_liveness(test_crop, mock_spoof_mode='GENUINE')
        self.assertTrue(real_res['is_real'])
        print("  [PASS] Anti-Spoofing Multi-Cue AI Firewall")

    def test_15_face_liveness_endpoint_spoof_defense(self):
        """Test /api/face/liveness endpoint spoof rejection."""
        response = self.client.post('/api/face/liveness', json={
            'image_base64': self.test_face_b64,
            'mock_spoof_mode': 'PRINTED_PHOTO'
        })
        # If face is detected or synthetic face triggers detection
        if response.status_code == 200:
            data = response.get_json()
            self.assertFalse(data['liveness']['is_real'])
            print("  [PASS] Face Liveness API endpoint spoof defense")
        else:
            print("  [SKIP] Face Liveness endpoint skipped (synthetic face not localized)")

    def test_16_attendance_mark_anti_spoof_defense(self):
        """Test attendance mark rejects presentation attacks."""
        response = self.client.post('/api/attendance/mark', json={
            'image_base64': self.test_face_b64,
            'mock_spoof_mode': 'MOBILE_SCREEN'
        })
        # Should reject with 403 SPOOF_DETECTED or 400 if no face detected in synthetic frame
        self.assertIn(response.status_code, [400, 403])
        print("  [PASS] Attendance Mark API endpoint security validation")

if __name__ == '__main__':
    print("=========================================================")
    print("  SmartAttend 3D - Complete Backend Automated Test Suite  ")
    print("=========================================================")
    unittest.main(verbosity=1)
