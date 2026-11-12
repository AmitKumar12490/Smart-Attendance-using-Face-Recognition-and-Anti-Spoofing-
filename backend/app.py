import os
from app import create_app
from app.config import Config

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', '1') == '1'
    print(f"==================================================")
    print(f"  SmartAttend 3D – AI Workplace Security System   ")
    print(f"  API Backend running on http://127.0.0.1:{port}   ")
    print(f"==================================================")
    app.run(host='0.0.0.0', port=port, debug=debug)
