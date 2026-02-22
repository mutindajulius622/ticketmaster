import os
import secrets
from dotenv import load_dotenv

load_dotenv()

def get_secret_key():
    """Generate or retrieve a secure secret key"""
    key = os.environ.get('SECRET_KEY')
    if not key:
        key = secrets.token_hex(32)
        import logging
        logging.getLogger(__name__).warning("No SECRET_KEY set. Generated a temporary key. For production, set the SECRET_KEY environment variable.")
    return key

# Define the base directory of the application
BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))

# Define the instance folder path
INSTANCE_FOLDER = os.path.join(BASE_DIR, 'instance')
if not os.path.exists(INSTANCE_FOLDER):
    os.makedirs(INSTANCE_FOLDER)

class Config:
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URI', f'sqlite:///{os.path.join(INSTANCE_FOLDER, "app.db")}')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = get_secret_key()
    
    # M-Pesa Configuration
    MPESA_ENVIRONMENT = os.environ.get('MPESA_ENVIRONMENT', 'sandbox')  # 'sandbox' or 'production'
    MPESA_CONSUMER_KEY = os.environ.get('MPESA_CONSUMER_KEY', '')
    MPESA_CONSUMER_SECRET = os.environ.get('MPESA_CONSUMER_SECRET', '')
    MPESA_BUSINESS_SHORT_CODE = os.environ.get('MPESA_BUSINESS_SHORT_CODE', '')
    MPESA_PASSKEY = os.environ.get('MPESA_PASSKEY', '')
    MPESA_CALLBACK_URL = os.environ.get('MPESA_CALLBACK_URL', '')
    
    # Payment limits
    MINIMUM_PAYMENT_AMOUNT = float(os.environ.get('MINIMUM_PAYMENT_AMOUNT', 1))
    MAXIMUM_PAYMENT_AMOUNT = float(os.environ.get('MAXIMUM_PAYMENT_AMOUNT', 100000))
    
    # M-Pesa API URLs
    @property
    def MPESA_AUTH_URL(self):
        if self.MPESA_ENVIRONMENT == 'production':
            return 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
        return 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
    
    @property
    def MPESA_STK_PUSH_URL(self):
        if self.MPESA_ENVIRONMENT == 'production':
            return 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
        return 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
    
    @property
    def MPESA_QUERY_URL(self):
        if self.MPESA_ENVIRONMENT == 'production':
            return 'https://api.safaricom.co.ke/mpesa/stkpush/v1/query'
        return 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/query'