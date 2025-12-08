from flask import Flask, jsonify
from app.config import config
from app.extensions import db, migrate, cors, jwt, mail
from app.routes import api_blueprint
from app.models import User, Property, Lease, Payment, MaintenanceTicket
import uuid
import os


def create_app(config_name='default'):
    """Application factory function."""
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config['CORS_ORIGINS']}})
    jwt.init_app(app)
    mail.init_app(app)
    
    # Create upload folder
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Register blueprints
    app.register_blueprint(api_blueprint, url_prefix='/api')
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'success': False,
            'message': 'Resource not found',
            'error': str(error)
        }), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({
            'success': False,
            'message': 'Internal server error',
            'error': str(error)
        }), 500
    
    # JWT configuration
    @jwt.user_identity_loader
    def user_identity_lookup(user):
        return user.id
    
    @jwt.user_lookup_loader
    def user_lookup_callback(_jwt_header, jwt_data):
        identity = jwt_data["sub"]
        return User.query.filter_by(id=identity).first()
    
    # Shell context
    @app.shell_context_processor
    def make_shell_context():
        return {
            'db': db,
            'User': User,
            'Property': Property,
            'Lease': Lease,
            'Payment': Payment,
            'MaintenanceTicket': MaintenanceTicket
        }
    
    return app
