from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from config import config
from app.models import db
from app.routes.auth import auth_bp
from app.routes.events import events_bp
from app.routes.tickets import tickets_bp
from app.routes.payments import payments_bp
from app.routes.admin import admin_bp
from app.routes.search import search_bp
from app.routes.seats import seats_bp
import os


def create_app(config_name=None):
    """Application factory"""
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')
    
    app = Flask(__name__)
    
    # Load configuration
    cfg = config.get(config_name, config['default'])
    app.config.from_object(cfg)
    
    # Ensure SQLALCHEMY_DATABASE_URI is set
    if not app.config.get('SQLALCHEMY_DATABASE_URI'):
        db_url = os.getenv('DATABASE_URL')
        if db_url:
            if db_url.startswith("postgres://"):
                db_url = db_url.replace("postgres://", "postgresql://", 1)
            app.config['SQLALCHEMY_DATABASE_URI'] = db_url
        else:
            app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:////tmp/ticket_master.db'
    
    # Initialize extensions
    db.init_app(app)
    CORS(app, origins=app.config['CORS_ORIGINS'])
    JWTManager(app)
    Migrate(app, db)
    
    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(events_bp)
    app.register_blueprint(tickets_bp)
    app.register_blueprint(payments_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(search_bp)
    app.register_blueprint(seats_bp)
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Resource not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Internal server error'}), 500
    
    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({'status': 'healthy', 'service': 'ticket-master-api'}), 200
    
    # Serve uploaded images
    if os.getenv('VERCEL'):
        upload_dir = '/tmp/uploads'
    else:
        upload_dir = os.path.join(os.path.dirname(app.root_path), 'uploads')
    
    os.makedirs(upload_dir, exist_ok=True)

    from flask import send_from_directory
    @app.route('/uploads/<path:filename>')
    def serve_upload(filename):
        return send_from_directory(upload_dir, filename)

    # Context for database operations
    with app.app_context():
        db.create_all()

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)
