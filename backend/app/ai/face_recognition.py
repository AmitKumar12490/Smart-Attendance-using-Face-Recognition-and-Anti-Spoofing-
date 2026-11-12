import json
from typing import List, Dict, Any, Optional, Tuple
from .face_embedding import embedding_generator, FaceEmbeddingGenerator
from ..utils.db import query_db

class FaceMatcher:
    """
    Biometric Face Recognition & Identity Matching Service.
    Compares live probe embeddings with registered employee biometrics using SFace Deep Neural Network similarity.
    """

    # OpenCV SFace official cosine similarity threshold is 0.363.
    # We use 0.380 to guarantee strong discrimination and eliminate false positives.
    DEFAULT_THRESHOLD = 0.380

    def __init__(self, match_threshold: float = DEFAULT_THRESHOLD):
        self.match_threshold = match_threshold

    def match_face(
        self,
        probe_embedding: List[float],
        enrolled_records: Optional[List[Dict[str, Any]]] = None,
        custom_threshold: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Finds the closest enrolled employee biometric match using SFace cosine similarity.
        
        Args:
            probe_embedding: 128D float vector of the live face.
            enrolled_records: Optional list of preloaded records with 'employee_id' and 'embedding_vector'.
            custom_threshold: Optional custom threshold override.
            
        Returns:
            Dict with 'matched', 'employee_id', 'employee', 'confidence', 'raw_score', 'margin'.
        """
        threshold = custom_threshold if custom_threshold is not None else self.match_threshold

        if enrolled_records is None:
            # Query all active enrolled face embeddings
            sql = """
                SELECT fe.id as embedding_id, fe.employee_id, fe.embedding_vector, fe.quality_score,
                       e.employee_code, e.first_name, e.last_name, e.email, e.designation,
                       e.status, e.profile_photo_url, d.name as department_name
                FROM face_embeddings fe
                JOIN employees e ON fe.employee_id = e.id
                LEFT JOIN departments d ON e.department_id = d.id
                WHERE e.status = 'ACTIVE'
            """
            enrolled_records = query_db(sql)

        if not enrolled_records:
            return {
                'matched': False,
                'employee_id': None,
                'employee': None,
                'confidence': 0.0,
                'raw_score': 0.0,
                'threshold_used': threshold,
                'message': 'No registered face biometrics found in the database.'
            }

        scores = []
        for record in enrolled_records:
            try:
                emb_vec = record['embedding_vector']
                if isinstance(emb_vec, str):
                    emb_vec = json.loads(emb_vec)
                
                sim = FaceEmbeddingGenerator.cosine_similarity(probe_embedding, emb_vec)
                scores.append({
                    'score': sim,
                    'record': record
                })
            except Exception as e:
                print(f"[FaceMatcher] Error parsing embedding for employee {record.get('employee_id')}: {e}")
                continue

        if not scores:
            return {
                'matched': False,
                'employee_id': None,
                'employee': None,
                'confidence': 0.0,
                'raw_score': 0.0,
                'threshold_used': threshold,
                'message': 'Error parsing enrolled biometrics.'
            }

        # Sort descending by similarity score
        scores.sort(key=lambda x: x['score'], reverse=True)
        best = scores[0]
        best_score = best['score']
        second_score = scores[1]['score'] if len(scores) > 1 else 0.0
        margin = round(best_score - second_score, 4)

        is_matched = best_score >= threshold
        best_record = best['record']

        employee_info = None
        if is_matched:
            employee_info = {
                'id': best_record['employee_id'],
                'employee_code': best_record.get('employee_code'),
                'first_name': best_record.get('first_name'),
                'last_name': best_record.get('last_name'),
                'full_name': f"{best_record.get('first_name', '')} {best_record.get('last_name', '')}".strip(),
                'email': best_record.get('email'),
                'designation': best_record.get('designation'),
                'department': best_record.get('department_name'),
                'profile_photo_url': best_record.get('profile_photo_url')
            }
            # Scaled confidence for display [0.38 -> 75%, 0.70+ -> 95-99%]
            conf_display = round(min(0.99, 0.75 + max(0.0, best_score - 0.38) / (1.0 - 0.38) * 0.24), 4)
        else:
            conf_display = round(max(0.0, best_score), 4)

        return {
            'matched': is_matched,
            'employee_id': best_record['employee_id'] if is_matched else None,
            'employee': employee_info,
            'confidence': conf_display,
            'raw_score': round(best_score, 4),
            'margin': margin,
            'threshold_used': threshold,
            'message': 'Identity verified successfully' if is_matched else f"Face confidence ({best_score:.2f}) below verification threshold ({threshold:.2f}). Identity not recognized."
        }

# Singleton instance
face_matcher = FaceMatcher()
