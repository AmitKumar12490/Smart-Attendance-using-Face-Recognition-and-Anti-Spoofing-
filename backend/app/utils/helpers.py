import base64
import re
import cv2
import numpy as np
import datetime
from typing import Tuple, Optional

def parse_base64_image(image_data: str) -> Optional[np.ndarray]:
    """
    Decodes a base64 string or data-URL (e.g. data:image/jpeg;base64,...)
    into an OpenCV BGR numpy ndarray.
    """
    if not image_data:
        return None
    try:
        # Strip header if present
        if "base64," in image_data:
            image_data = image_data.split("base64,")[1]
        decoded = base64.b64decode(image_data)
        np_arr = np.frombuffer(decoded, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        return img
    except Exception as e:
        print(f"[Helper] Error parsing base64 image: {e}")
        return None

def encode_image_to_base64(img: np.ndarray, format_ext=".jpg") -> str:
    """Encodes an OpenCV image to a base64 Data URL string."""
    _, buffer = cv2.imencode(format_ext, img)
    b64_str = base64.b64encode(buffer).decode('utf-8')
    mime = "image/jpeg" if format_ext in [".jpg", ".jpeg"] else "image/png"
    return f"data:{mime};base64,{b64_str}"

def calculate_time_diff_hours(start_time_str: str, end_time_str: str) -> float:
    """Calculates difference in hours between two timestamp strings or datetime objects."""
    try:
        fmt = "%Y-%m-%d %H:%M:%S"
        t1 = datetime.datetime.strptime(str(start_time_str)[:19], fmt)
        t2 = datetime.datetime.strptime(str(end_time_str)[:19], fmt)
        diff = (t2 - t1).total_seconds() / 3600.0
        return max(0.0, round(diff, 2))
    except Exception:
        return 0.0

def is_arrival_late(check_in_dt: datetime.datetime, shift_start_str: str = "09:00", grace_mins: int = 15) -> bool:
    """Determines if the check-in timestamp exceeds shift start time + grace period."""
    try:
        parts = shift_start_str.split(":")
        shift_h = int(parts[0])
        shift_m = int(parts[1]) if len(parts) > 1 else 0
        
        target_minutes = (shift_h * 60) + shift_m + grace_mins
        actual_minutes = (check_in_dt.hour * 60) + check_in_dt.minute
        
        return actual_minutes > target_minutes
    except Exception:
        return False
