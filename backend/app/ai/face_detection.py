import cv2
import numpy as np
import os
from typing import List, Tuple, Dict, Optional, Any
from pathlib import Path

class FaceDetector:
    """
    High-performance face detector utilizing OpenCV's Deep Learning YuNet
    architecture with 5-point facial landmark detection and Haar Cascade fallback.
    """
    def __init__(self):
        self.yunet_detector = None
        self.face_cascade = None
        self.eye_cascade = None
        
        # Check for YuNet ONNX model
        current_dir = Path(__file__).resolve().parent
        model_path = current_dir / "models" / "face_detection_yunet_2023mar.onnx"
        
        if model_path.exists() and hasattr(cv2, 'FaceDetectorYN'):
            try:
                self.yunet_detector = cv2.FaceDetectorYN.create(
                    str(model_path),
                    "",
                    (320, 320),
                    score_threshold=0.6,
                    nms_threshold=0.3,
                    top_k=5000
                )
                print(f"[FaceDetector] Loaded Deep Learning YuNet detector from {model_path.name}")
            except Exception as e:
                print(f"[FaceDetector] Failed to initialize YuNet: {e}")

        # Fallback Haar Cascade
        try:
            if hasattr(cv2, 'CascadeClassifier') and hasattr(cv2, 'data') and hasattr(cv2.data, 'haarcascades'):
                cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
                self.face_cascade = cv2.CascadeClassifier(cascade_path)
                eye_cascade_path = cv2.data.haarcascades + 'haarcascade_eye.xml'
                self.eye_cascade = cv2.CascadeClassifier(eye_cascade_path)
        except Exception as e:
            print(f"[FaceDetector] Haar Cascade notice: {e}")

    def detect_faces(self, image: np.ndarray, min_size: int = 40) -> List[Dict[str, Any]]:
        """
        Detects faces in an image and returns bounding boxes, 5 landmarks, and quality metrics.
        Returns a list of dicts:
        [{'box': (x, y, w, h), 'confidence': float, 'raw_face': array, 'landmarks': [...], 'center_dist': float}]
        Sorted so the primary face (closest to center and largest) is at index 0.
        """
        if image is None or image.size == 0:
            return []

        h_img, w_img = image.shape[:2]
        center_x, center_y = w_img / 2.0, h_img / 2.0
        results = []

        # 1. Try YuNet deep learning detector
        if self.yunet_detector is not None:
            try:
                self.yunet_detector.setInputSize((w_img, h_img))
                _, faces = self.yunet_detector.detect(image)
                if faces is not None and len(faces) > 0:
                    for f in faces:
                        x, y, w, h = int(f[0]), int(f[1]), int(f[2]), int(f[3])
                        if w < min_size or h < min_size:
                            continue
                        
                        # Clamp to image boundaries
                        x = max(0, x)
                        y = max(0, y)
                        w = min(w_img - x, w)
                        h = min(h_img - y, h)
                        if w <= 0 or h <= 0:
                            continue

                        conf = float(f[14])
                        # 5 landmarks: right eye, left eye, nose, right mouth, left mouth
                        landmarks = [
                            (int(f[4]), int(f[5])),
                            (int(f[6]), int(f[7])),
                            (int(f[8]), int(f[9])),
                            (int(f[10]), int(f[11])),
                            (int(f[12]), int(f[13]))
                        ]

                        face_cx, face_cy = x + w / 2.0, y + h / 2.0
                        center_dist = ((face_cx - center_x) ** 2 + (face_cy - center_y) ** 2) ** 0.5
                        # Normalized center distance [0.0 = dead center, 1.0 = corner]
                        diag = (w_img ** 2 + h_img ** 2) ** 0.5
                        norm_center_dist = center_dist / (diag / 2.0)

                        area = w * h

                        results.append({
                            'box': (x, y, w, h),
                            'confidence': round(conf, 4),
                            'landmarks': landmarks,
                            'raw_face': f,  # needed for SFace alignCrop
                            'center_dist': round(center_dist, 1),
                            'norm_center_dist': round(norm_center_dist, 3),
                            'area': area,
                            'detector': 'YuNet'
                        })
            except Exception as e:
                print(f"[FaceDetector] YuNet detection error: {e}")

        # 2. Fallback to Haar Cascade if YuNet returned nothing
        if not results and self.face_cascade is not None:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            enhanced_gray = clahe.apply(gray)
            
            haar_faces = self.face_cascade.detectMultiScale(
                enhanced_gray,
                scaleFactor=1.12,
                minNeighbors=4,
                minSize=(min_size, min_size)
            )

            for (x, y, w, h) in haar_faces:
                face_roi_gray = enhanced_gray[y:y+h, x:x+w]
                eyes = []
                if self.eye_cascade:
                    eyes = self.eye_cascade.detectMultiScale(face_roi_gray, scaleFactor=1.1, minNeighbors=3, minSize=(15, 15))
                
                laplacian_var = float(cv2.Laplacian(face_roi_gray, cv2.CV_64F).var()) if hasattr(cv2, 'Laplacian') else 250.0
                quality_score = min(1.0, (laplacian_var / 300.0) * 0.5 + (0.5 if len(eyes) >= 1 else 0.4))
                
                face_cx, face_cy = x + w / 2.0, y + h / 2.0
                center_dist = ((face_cx - center_x) ** 2 + (face_cy - center_y) ** 2) ** 0.5
                diag = (w_img ** 2 + h_img ** 2) ** 0.5
                norm_center_dist = center_dist / (diag / 2.0)

                results.append({
                    'box': (int(x), int(y), int(w), int(h)),
                    'confidence': float(round(quality_score, 4)),
                    'landmarks': [],
                    'raw_face': None,
                    'center_dist': round(center_dist, 1),
                    'norm_center_dist': round(norm_center_dist, 3),
                    'area': int(w * h),
                    'detector': 'HaarCascade'
                })

        # Sort so primary face is first:
        # Composite score = area weight (0.6) - center distance penalty (0.4)
        if results:
            max_area = max(r['area'] for r in results) or 1
            results.sort(key=lambda r: (r['area'] / max_area) * 0.65 - r['norm_center_dist'] * 0.35, reverse=True)

        return results

    def extract_face_crop(self, image: np.ndarray, box: Tuple[int, int, int, int], target_size: Tuple[int, int] = (160, 160), padding_pct: float = 0.15) -> Optional[np.ndarray]:
        """
        Extracts the face region with margin padding and resizes to target_size.
        """
        if image is None or image.size == 0:
            return None

        h_img, w_img = image.shape[:2]
        x, y, w, h = box

        pad_x = int(w * padding_pct)
        pad_y = int(h * padding_pct)

        x1 = max(0, x - pad_x)
        y1 = max(0, y - pad_y)
        x2 = min(w_img, x + w + pad_x)
        y2 = min(h_img, y + h + pad_y)

        crop = image[y1:y2, x1:x2]
        if crop.size == 0:
            return None

        aligned_face = cv2.resize(crop, target_size, interpolation=cv2.INTER_CUBIC)
        return aligned_face

# Singleton instance
detector = FaceDetector()
