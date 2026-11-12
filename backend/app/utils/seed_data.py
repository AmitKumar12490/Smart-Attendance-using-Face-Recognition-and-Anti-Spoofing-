import datetime
import random
import json
from .db import get_db_connection, execute_db, query_db, init_db
from .security import hash_password
from ..ai.face_embedding import embedding_generator
import numpy as np

def generate_random_unit_embedding(seed_offset: int) -> list:
    """Generates a reproducible 128D normalized embedding vector for demo employees."""
    rng = np.random.default_rng(1000 + seed_offset)
    vec = rng.standard_normal(128).astype(np.float32)
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm
    return [round(float(x), 6) for x in vec.tolist()]

def seed_database(force_reseed: bool = False):
    """Seeds the database with full enterprise demo data using realistic Indian workforce profiles."""
    init_db()
    
    # Check if already seeded and whether we want to force refresh to Indian demo data
    existing_users = query_db("SELECT COUNT(*) as c FROM users", one=True)
    if existing_users and existing_users['c'] > 0 and not force_reseed:
        # Check if already seeded with Indian data (e.g. EMP-1001)
        has_indian_data = query_db("SELECT id FROM employees WHERE employee_code = 'EMP-1001'", one=True)
        if has_indian_data:
            print("[SmartAttend Seed] Indian employee dataset already present. Skipping seed.")
            return

    print("[SmartAttend Seed] Seeding enterprise Indian workforce dataset...")
    now = datetime.datetime.now()
    now_str = now.strftime("%Y-%m-%d %H:%M:%S")

    # Clean old data if reseeding
    if force_reseed or (existing_users and existing_users['c'] > 0):
        conn = get_db_connection()
        try:
            conn.execute("DELETE FROM attendance")
            conn.execute("DELETE FROM face_embeddings")
            conn.execute("DELETE FROM security_events")
            conn.execute("DELETE FROM employees")
            conn.execute("DELETE FROM users")
            conn.execute("DELETE FROM departments")
            conn.commit()
        finally:
            conn.close()

    # 1. Departments (As specified: Engineering, Human Resources, Finance, Marketing, Operations, Product, Design, IT)
    departments = [
        ("Engineering", "ENG", "Core software platform, 3D graphics, and distributed systems architecture"),
        ("Product", "PROD", "Product strategy, user experience discovery, and roadmapping"),
        ("Design", "DES", "Product design, UI/UX systems, and brand graphics"),
        ("Human Resources", "HR", "People operations, workplace culture, talent acquisition, and compliance"),
        ("Finance", "FIN", "Corporate finance, payroll operations, and budget management"),
        ("IT", "IT", "Enterprise infrastructure, cloud security, and hardware support"),
        ("Marketing", "MKT", "Product marketing, brand communication, and user growth"),
        ("Operations", "OPS", "Workforce scheduling, facilities, and physical security management")
    ]
    dept_ids = {}
    for name, code, desc in departments:
        d_id = execute_db(
            "INSERT INTO departments (name, code, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
            (name, code, desc, now_str, now_str),
            return_id=True
        )
        dept_ids[name] = d_id
        dept_ids[code] = d_id

    # 2. System Administrative Users
    admin_pw = hash_password("Admin@123")
    admin_user_id = execute_db("""
        INSERT INTO users (email, password_hash, full_name, role, is_active, created_at, updated_at)
        VALUES (?, ?, ?, 'ADMIN', 1, ?, ?)
    """, ("admin@smartattend3d.io", admin_pw, "Chief Administrator", now_str, now_str), return_id=True)

    sec_pw = hash_password("Security@123")
    sec_user_id = execute_db("""
        INSERT INTO users (email, password_hash, full_name, role, is_active, created_at, updated_at)
        VALUES (?, ?, ?, 'SECURITY_OFFICER', 1, ?, ?)
    """, ("security@smartattend3d.io", sec_pw, "Duty Security Officer", now_str, now_str), return_id=True)

    # 3. Realistic Indian Employees (15 Employees across Indian Tech Hubs)
    employee_seeds = [
        ("EMP-1001", "Aarav", "Sharma", "aarav.sharma@smartattend3d.io", "+91 98765 43210", dept_ids["Engineering"], "Senior Software Engineer", "Bengaluru", "2022-04-15", "09:00", "18:00", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80"),
        ("EMP-1002", "Priya", "Verma", "priya.verma@smartattend3d.io", "+91 98765 43211", dept_ids["Human Resources"], "HR Executive", "Bengaluru", "2023-01-10", "09:00", "17:30", "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80"),
        ("EMP-1003", "Rahul", "Kumar", "rahul.kumar@smartattend3d.io", "+91 98765 43212", dept_ids["Engineering"], "Software Engineer", "Hyderabad", "2023-06-01", "09:30", "18:30", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80"),
        ("EMP-1004", "Ananya", "Singh", "ananya.singh@smartattend3d.io", "+91 98765 43213", dept_ids["Product"], "Product Manager", "Pune", "2022-09-15", "09:00", "17:30", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"),
        ("EMP-1005", "Rohan", "Mehta", "rohan.mehta@smartattend3d.io", "+91 98765 43214", dept_ids["Design"], "UI/UX Designer", "Mumbai", "2023-03-20", "10:00", "18:30", "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80"),
        ("EMP-1006", "Sneha", "Patel", "sneha.patel@smartattend3d.io", "+91 98765 43215", dept_ids["Finance"], "Financial Analyst", "Gurugram", "2021-11-05", "09:00", "17:00", "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80"),
        ("EMP-1007", "Aditya", "Gupta", "aditya.gupta@smartattend3d.io", "+91 98765 43216", dept_ids["IT"], "DevOps Engineer", "Noida", "2023-08-12", "09:00", "17:30", "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80"),
        ("EMP-1008", "Neha", "Sharma", "neha.sharma@smartattend3d.io", "+91 98765 43217", dept_ids["Operations"], "Operations Manager", "Chennai", "2022-02-18", "08:30", "17:00", "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=400&auto=format&fit=crop&q=80"),
        ("EMP-1009", "Vikram", "Rao", "vikram.rao@smartattend3d.io", "+91 98765 43218", dept_ids["Engineering"], "Engineering Manager", "Bengaluru", "2020-08-01", "09:00", "18:00", "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80"),
        ("EMP-1010", "Kavya", "Iyer", "kavya.iyer@smartattend3d.io", "+91 98765 43219", dept_ids["Marketing"], "Marketing Lead", "Hyderabad", "2022-07-25", "09:30", "18:00", "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80"),
        ("EMP-1011", "Arjun", "Nair", "arjun.nair@smartattend3d.io", "+91 98765 43220", dept_ids["Engineering"], "Software Engineer", "Pune", "2023-11-01", "09:00", "17:30", "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80"),
        ("EMP-1012", "Pooja", "Mishra", "pooja.mishra@smartattend3d.io", "+91 98765 43221", dept_ids["Human Resources"], "HR Specialist", "Mumbai", "2023-04-10", "09:00", "17:30", "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80"),
        ("EMP-1013", "Karan", "Malhotra", "karan.malhotra@smartattend3d.io", "+91 98765 43222", dept_ids["Product"], "Associate Product Manager", "Gurugram", "2024-01-15", "09:30", "18:00", "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&auto=format&fit=crop&q=80"),
        ("EMP-1014", "Simran", "Kaur", "simran.kaur@smartattend3d.io", "+91 98765 43223", dept_ids["Design"], "UI/UX Designer", "Noida", "2023-05-12", "10:00", "18:30", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80"),
        ("EMP-1015", "Aditi", "Kapoor", "aditi.kapoor@smartattend3d.io", "+91 98765 43224", dept_ids["Finance"], "Data Analyst", "Chandigarh", "2022-10-01", "09:00", "17:30", "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80")
    ]

    emp_ids = []
    for idx, (code, fname, lname, email, phone, dept_id, desig, loc, jdate, s_start, s_end, photo) in enumerate(employee_seeds):
        user_pw = hash_password("Employee@123")
        u_id = execute_db("""
            INSERT INTO users (email, password_hash, full_name, role, is_active, created_at, updated_at)
            VALUES (?, ?, ?, 'EMPLOYEE', 1, ?, ?)
        """, (email, user_pw, f"{fname} {lname}", now_str, now_str), return_id=True)

        emp_id = execute_db("""
            INSERT INTO employees (
                user_id, employee_code, first_name, last_name, email, phone,
                department_id, designation, location, joining_date, status,
                profile_photo_url, face_registered, face_registered_at,
                shift_start_time, shift_end_time, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, 1, ?, ?, ?, ?, ?)
        """, (
            u_id, code, fname, lname, email, phone,
            dept_id, desig, loc, jdate, photo, now_str,
            s_start, s_end, now_str, now_str
        ), return_id=True)

        emp_ids.append(emp_id)

        # Biometric embedding vector
        unit_vec = generate_random_unit_embedding(idx)
        execute_db("""
            INSERT INTO face_embeddings (
                employee_id, embedding_vector, model_name, model_version,
                quality_score, created_at
            ) VALUES (?, ?, 'SmartAttend-DeepNet-v2', '2.4.0', 0.98, ?)
        """, (emp_id, json.dumps(unit_vec), now_str))

    # Also keep alex.vance as secondary alias account pointing to EMP-1001 so legacy references don't fail
    try:
        execute_db("""
            INSERT INTO users (email, password_hash, full_name, role, is_active, created_at, updated_at)
            VALUES ('alex.vance@smartattend3d.io', ?, 'Aarav Sharma (Alex Vance)', 'EMPLOYEE', 1, ?, ?)
        """, (hash_password("Employee@123"), now_str, now_str))
    except Exception:
        pass

    # 4. Generate 30 days of realistic attendance history up to TODAY
    random.seed(42)
    today = datetime.date.today()
    for day_offset in range(30, -1, -1):
        log_date = today - datetime.timedelta(days=day_offset)
        # Skip weekends for historic logs, but if today happens to be a weekend, still generate for demo inspection
        if log_date.weekday() >= 5 and day_offset > 0:
            continue
            
        date_str = log_date.strftime("%Y-%m-%d")
        
        for e_idx, emp_id in enumerate(emp_ids):
            # Deterministic pseudo-random variation per employee and day
            rand_val = (hash(f"{date_str}-{emp_id}") % 100) / 100.0
            
            # Today's live status distribution:
            # ~80% Present, ~13% Late, ~7% Absent
            if day_offset == 0:
                if e_idx in [0, 1, 2, 3, 4, 6, 8, 9, 10, 11, 13, 14]: # 12 employees Present
                    status = "PRESENT"
                    check_in_hour = 8
                    check_in_min = 45 + (e_idx % 14)
                elif e_idx in [5, 12]: # 2 employees Late
                    status = "LATE"
                    check_in_hour = 9
                    check_in_min = 20 + (e_idx % 20)
                else: # 1 employee Absent
                    status = "ABSENT"
            else:
                if rand_val < 0.78:
                    status = "PRESENT"
                    check_in_hour = 8
                    check_in_min = 40 + int(rand_val * 18)
                elif rand_val < 0.92:
                    status = "LATE"
                    check_in_hour = 9
                    check_in_min = 16 + int(rand_val * 28)
                else:
                    status = "ABSENT"

            if status != "ABSENT":
                check_in_dt = datetime.datetime(log_date.year, log_date.month, log_date.day, check_in_hour, check_in_min, (e_idx * 7) % 60)
                check_in_str = check_in_dt.strftime("%Y-%m-%d %H:%M:%S")
                
                if day_offset == 0:
                    check_out_str = None
                    hours = round((now - check_in_dt).total_seconds() / 3600.0, 1)
                    if hours < 0:
                        hours = 4.2
                else:
                    work_mins = 480 + (e_idx * 9) % 70
                    check_out_dt = check_in_dt + datetime.timedelta(minutes=work_mins)
                    check_out_str = check_out_dt.strftime("%Y-%m-%d %H:%M:%S")
                    hours = round(work_mins / 60.0, 2)

                confidence = round(0.94 + (rand_val * 0.05), 4)
                liveness = round(0.92 + (rand_val * 0.07), 4)
                
                terminal = ["Bengaluru Main Gate Kiosk", "Hyderabad Tech Portal", "Mumbai West Wing Entry", "Gurugram Campus Terminal"][e_idx % 4]
                
                execute_db("""
                    INSERT INTO attendance (
                        employee_id, date, check_in_time, check_out_time, status,
                        work_hours, recognition_confidence, liveness_score,
                        is_spoof_prevented, verification_mode, device_name,
                        location_label, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'FACE_BIOMETRIC_3D', ?, 'India Technology Center', ?, ?)
                """, (
                    emp_id, date_str, check_in_str, check_out_str, status,
                    hours, confidence, liveness, terminal, check_in_str, check_in_str
                ))

    # 5. Seed Security Events
    security_incidents = [
        ("SPOOF_PHOTO_DETECTED", "HIGH", None, 0.42, 0.21, "Printed Paper Photograph", "Bengaluru Main Gate Kiosk", "High-contrast 2D photo paper presented to sensor. LBP texture signature rejected.", False),
        ("SPOOF_SCREEN_DETECTED", "CRITICAL", None, 0.35, 0.16, "Mobile/Tablet Screen", "Hyderabad Tech Portal", "Detected 120Hz digital refresh rate moiré interference and glare harmonics.", False),
        ("SPOOF_VIDEO_REPLAY", "CRITICAL", None, 0.48, 0.28, "Video Replay Attack", "Mumbai West Wing Entry", "Synthetic optical loop detected with unnatural eyelid blink temporal periodicity.", True),
        ("UNKNOWN_FACE_ATTEMPT", "MEDIUM", None, 0.51, 0.94, "Unregistered Visitor", "Gurugram Campus Terminal", "Live human face verified, but cosine similarity failed against employee biometrics.", True),
        ("SPOOF_PHOTO_DETECTED", "HIGH", None, 0.38, 0.19, "Printed Matte Paper", "Bengaluru Main Gate Kiosk", "Attempted badge bypass using color laser print. Blocked by Fourier analyzer.", True)
    ]

    for idx, (etype, sev, emp_id, conf, live, vector, device, desc, res) in enumerate(security_incidents):
        event_time = (now - datetime.timedelta(hours=random.randint(1, 48))).strftime("%Y-%m-%d %H:%M:%S")
        res_time = now_str if res else None
        res_by = admin_user_id if res else None
        
        execute_db("""
            INSERT INTO security_events (
                event_type, severity, attempted_employee_id, confidence_score,
                liveness_score, attack_vector, device_name, location_label,
                description, resolved, resolved_by, resolved_at, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Tech Campus Perimeter', ?, ?, ?, ?, ?)
        """, (etype, sev, emp_id, conf, live, vector, device, desc, 1 if res else 0, res_by, res_time, event_time))

    # 6. Seed System Settings
    settings = [
        ("FACE_CONFIDENCE_THRESHOLD", "0.68", "Minimum cosine similarity confidence for identity match", "AI_SECURITY"),
        ("ANTI_SPOOFING_THRESHOLD", "0.72", "Decision threshold for multi-cue liveness classification", "AI_SECURITY"),
        ("OFFICE_START_TIME", "09:00", "Official daily shift commencement hour", "ATTENDANCE"),
        ("LATE_GRACE_PERIOD_MINUTES", "15", "Allowable arrival window before tagging employee as late", "ATTENDANCE"),
        ("OFFICE_END_TIME", "17:00", "Standard daily shift end time", "ATTENDANCE"),
        ("SECURITY_ALERT_EMAIL", "security@smartattend3d.io", "Automated alert destination for high severity spoofs", "GENERAL"),
        ("TERMINAL_CAMERA_RESOLUTION", "1080p", "Webcam stream capture resolution", "HARDWARE")
    ]
    for k, v, d, c in settings:
        execute_db("INSERT OR REPLACE INTO system_settings (key, value, description, category) VALUES (?, ?, ?, ?)", (k, v, d, c))

    print("[SmartAttend Seed] Realistic Indian demo data generated successfully.")

if __name__ == "__main__":
    seed_database(force_reseed=True)
