import datetime
from typing import List, Dict, Any, Optional
from ..utils.db import query_db, execute_db

class SecurityService:
    @staticmethod
    def get_security_events(
        severity: Optional[str] = None,
        event_type: Optional[str] = None,
        resolved: Optional[bool] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        query = """
            SELECT se.*, e.first_name, e.last_name, e.employee_code, u.full_name as resolved_by_name
            FROM security_events se
            LEFT JOIN employees e ON se.attempted_employee_id = e.id
            LEFT JOIN users u ON se.resolved_by = u.id
            WHERE 1=1
        """
        params = []
        if severity:
            query += " AND se.severity = ?"
            params.append(severity.upper())
        if event_type:
            query += " AND se.event_type = ?"
            params.append(event_type)
        if resolved is not None:
            query += " AND se.resolved = ?"
            params.append(1 if resolved else 0)

        query += f" ORDER BY se.created_at DESC LIMIT {int(limit)}"
        return query_db(query, tuple(params))

    @staticmethod
    def resolve_event(event_id: int, user_id: int) -> bool:
        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        execute_db("""
            UPDATE security_events SET
                resolved = 1,
                resolved_by = ?,
                resolved_at = ?
            WHERE id = ?
        """, (user_id, now_str, event_id))
        return True

    @staticmethod
    def get_security_summary() -> Dict[str, Any]:
        total_events = query_db("SELECT COUNT(*) as count FROM security_events", one=True)['count'] or 0
        unresolved = query_db("SELECT COUNT(*) as count FROM security_events WHERE resolved = 0", one=True)['count'] or 0
        spoofs_blocked = query_db("SELECT COUNT(*) as count FROM security_events WHERE event_type LIKE '%SPOOF%'", one=True)['count'] or 0
        
        # Severity breakdown
        severity_dist = query_db("""
            SELECT severity, COUNT(*) as count
            FROM security_events
            GROUP BY severity
        """)

        # Attack vectors
        attack_dist = query_db("""
            SELECT attack_vector, COUNT(*) as count
            FROM security_events
            WHERE attack_vector IS NOT NULL
            GROUP BY attack_vector
        """)

        return {
            'total_events': total_events,
            'unresolved_alerts': unresolved,
            'spoofs_blocked': spoofs_blocked,
            'severity_distribution': {row['severity']: row['count'] for row in severity_dist},
            'attack_vector_distribution': {row['attack_vector']: row['count'] for row in attack_dist},
            'security_system_health': 'OPTIMAL' if unresolved < 5 else 'ATTENTION_REQUIRED'
        }
