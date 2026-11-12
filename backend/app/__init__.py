import os
from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from .config import Config
from .utils.db import init_db
from .utils.seed_data import seed_database

def create_app():
    app = Flask(__name__, static_folder=str(Config.UPLOAD_FOLDER))
    app.config.from_object(Config)

    # Enable CORS for frontend Vite development server & production builds
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Initialize Database & Seed data if first run
    with app.app_context():
        try:
            init_db()
            seed_database()
        except Exception as e:
            print(f"[SmartAttend 3D] DB Init Warning: {e}")

    # Register API Blueprints
    from .routes.auth_routes import auth_bp
    from .routes.employee_routes import employee_bp
    from .routes.face_routes import face_bp
    from .routes.attendance_routes import attendance_bp
    from .routes.analytics_routes import analytics_bp
    from .routes.security_routes import security_bp
    from .routes.report_routes import report_bp
    from .routes.settings_routes import settings_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(employee_bp)
    app.register_blueprint(face_bp)
    app.register_blueprint(attendance_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(security_bp)
    app.register_blueprint(report_bp)
    app.register_blueprint(settings_bp)

    # Static file serving for uploads/avatars
    @app.route('/uploads/<path:filename>')
    def serve_uploads(filename):
        return send_from_directory(str(Config.UPLOAD_FOLDER), filename)

    # Global Health Check & API Status
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'ONLINE',
            'service': 'SmartAttend 3D AI Core API',
            'version': '2.4.0',
            'ai_engine': 'OpenCV + 128D Deep Biometrics + Multi-Cue Anti-Spoofing',
            'database': 'SQLite / PostgreSQL-Ready'
        }), 200

    @app.errorhandler(404)
    def handle_not_found(e):
        return jsonify({'success': False, 'error': 'Requested API resource not found.'}), 404

    @app.errorhandler(500)
    def handle_server_error(e):
        return jsonify({'success': False, 'error': 'Internal server error in SmartAttend AI core.'}), 500

    return app
