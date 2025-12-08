from flask import Blueprint
from .auth import auth_bp
from .properties import properties_bp
from .leases import leases_bp
from .payments import payments_bp
from .maintenance import maintenance_bp
from .listings import listings_bp
from .users import users_bp

api_blueprint = Blueprint('api', __name__)

@api_blueprint.route('/health', methods=['GET'])
def health_check():
    return {
        'status': 'healthy',
        'service': 'Palmer Living Reality API',
        'version': '1.0.0'
    }

api_blueprint.register_blueprint(auth_bp, url_prefix='/auth')
api_blueprint.register_blueprint(properties_bp, url_prefix='/properties')
api_blueprint.register_blueprint(leases_bp, url_prefix='/leases')
api_blueprint.register_blueprint(payments_bp, url_prefix='/payments')
api_blueprint.register_blueprint(maintenance_bp, url_prefix='/maintenance')
api_blueprint.register_blueprint(listings_bp, url_prefix='/listings')
api_blueprint.register_blueprint(users_bp, url_prefix='/users')
