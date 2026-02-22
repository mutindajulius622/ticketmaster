"""
M-Pesa Service for handling payment integrations
Supports STK Push and Paybill payment methods
"""
import base64
import requests
import logging
from datetime import datetime
from ..config import Config

logger = logging.getLogger(__name__)


class MpesaService:
    """Service class for M-Pesa API integration"""
    
    def __init__(self):
        self.config = Config()
        self.access_token = None
        self.token_expiry = None
    
    def _get_access_token(self):
        """Get or refresh M-Pesa access token"""
        # Check if we have a valid token
        if self.access_token and self.token_expiry and datetime.utcnow() < self.token_expiry:
            return self.access_token
        
        try:
            # Encode consumer key and secret
            credentials = f"{self.config.MPESA_CONSUMER_KEY}:{self.config.MPESA_CONSUMER_SECRET}"
            encoded_credentials = base64.b64encode(credentials.encode()).decode()
            
            headers = {
                'Authorization': f'Basic {encoded_credentials}'
            }
            
            response = requests.get(
                self.config.MPESA_AUTH_URL,
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data.get('access_token')
                # Token typically expires in 3600 seconds, set expiry to 3500 for safety
                from datetime import timedelta
                self.token_expiry = datetime.utcnow() + timedelta(seconds=3500)
                return self.access_token
            else:
                logger.error(f"Failed to get access token: {response.text}")
                raise Exception(f"Failed to get M-Pesa access token: {response.text}")
                
        except requests.RequestException as e:
            logger.error(f"M-Pesa API request failed: {str(e)}")
            raise Exception(f"M-Pesa API request failed: {str(e)}")
    
    def _generate_password(self):
        """Generate the M-Pesa API password (base64 encoded BusinessShortCode + Passkey + Timestamp)"""
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        password_string = f"{self.config.MPESA_BUSINESS_SHORT_CODE}{self.config.MPESA_PASSKEY}{timestamp}"
        encoded_password = base64.b64encode(password_string.encode()).decode()
        return encoded_password, timestamp
    
    def initiate_stk_push(self, phone_number, amount, account_reference, transaction_desc):
        """
        Initiate M-Pesa STK Push (Lipa na M-Pesa Online)
        
        Args:
            phone_number: Customer's phone number (format: 254XXXXXXXXX)
            amount: Payment amount in KES
            account_reference: Account number/identifier
            transaction_desc: Description of the transaction
            
        Returns:
            dict: Response from M-Pesa API
        """
        try:
            # Get access token
            access_token = self._get_access_token()
            
            # Generate password and timestamp
            password, timestamp = self._generate_password()
            
            # Format phone number
            if phone_number.startswith('0'):
                phone_number = '254' + phone_number[1:]
            elif phone_number.startswith('+'):
                phone_number = phone_number[1:]
            
            # Prepare request payload
            payload = {
                'BusinessShortCode': self.config.MPESA_BUSINESS_SHORT_CODE,
                'Password': password,
                'Timestamp': timestamp,
                'TransactionType': 'CustomerPayBillOnline',
                'Amount': int(amount),
                'PartyA': phone_number,
                'PartyB': self.config.MPESA_BUSINESS_SHORT_CODE,
                'PhoneNumber': phone_number,
                'CallBackURL': self.config.MPESA_CALLBACK_URL,
                'AccountReference': account_reference,
                'TransactionDesc': transaction_desc
            }
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            response = requests.post(
                self.config.MPESA_STK_PUSH_URL,
                json=payload,
                headers=headers,
                timeout=30
            )
            
            response_data = response.json()
            logger.info(f"STK Push Response: {response_data}")
            
            return response_data
            
        except requests.RequestException as e:
            logger.error(f"STK Push request failed: {str(e)}")
            return {
                'ResponseCode': '1',
                'ResponseDescription': f'Request failed: {str(e)}'
            }
        except Exception as e:
            logger.error(f"STK Push error: {str(e)}")
            return {
                'ResponseCode': '1',
                'ResponseDescription': str(e)
            }
    
    def query_stk_status(self, checkout_request_id):
        """
        Query the status of an STK Push transaction
        
        Args:
            checkout_request_id: The CheckoutRequestID from the STK Push response
            
        Returns:
            dict: Response from M-Pesa API
        """
        try:
            # Get access token
            access_token = self._get_access_token()
            
            # Generate password and timestamp
            password, timestamp = self._generate_password()
            
            payload = {
                'BusinessShortCode': self.config.MPESA_BUSINESS_SHORT_CODE,
                'Password': password,
                'Timestamp': timestamp,
                'CheckoutRequestID': checkout_request_id
            }
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            response = requests.post(
                self.config.MPESA_QUERY_URL,
                json=payload,
                headers=headers,
                timeout=30
            )
            
            response_data = response.json()
            logger.info(f"STK Query Response: {response_data}")
            
            return response_data
            
        except requests.RequestException as e:
            logger.error(f"STK Query request failed: {str(e)}")
            return {
                'ResponseCode': '1',
                'ResponseDescription': f'Request failed: {str(e)}'
            }
        except Exception as e:
            logger.error(f"STK Query error: {str(e)}")
            return {
                'ResponseCode': '1',
                'ResponseDescription': str(e)
            }
    
    def parse_callback_data(self, callback_data):
        """
        Parse and validate M-Pesa callback data
        
        Args:
            callback_data: The raw callback data from M-Pesa
            
        Returns:
            dict: Parsed payment information
        """
        try:
            result = callback_data.get('Body', {}).get('stkCallback', {})
            
            parsed = {
                'checkout_request_id': result.get('CheckoutRequestID'),
                'result_code': result.get('ResultCode'),
                'result_desc': result.get('ResultDesc'),
                'success': result.get('ResultCode') == 0,
                'metadata': {}
            }
            
            if parsed['success']:
                metadata_items = result.get('CallbackMetadata', {}).get('Item', [])
                for item in metadata_items:
                    name = item.get('Name')
                    value = item.get('Value')
                    if name == 'MpesaReceiptNumber':
                        parsed['metadata']['receipt_number'] = value
                    elif name == 'TransactionDate':
                        parsed['metadata']['transaction_date'] = value
                    elif name == 'PhoneNumber':
                        parsed['metadata']['phone_number'] = value
                    elif name == 'Amount':
                        parsed['metadata']['amount'] = value
            
            return parsed
            
        except Exception as e:
            logger.error(f"Error parsing callback data: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def simulate_stk_push(self, phone_number, amount, account_reference, transaction_desc):
        """
        Simulate an STK Push response for testing (sandbox mode)
        This can be used when M-Pesa credentials are not configured
        
        Returns:
            dict: Simulated successful response
        """
        import uuid
        checkout_id = f"ws_co_{uuid.uuid4().hex[:8]}"
        merchant_id = f"ws_mer_{uuid.uuid4().hex[:8]}"
        
        return {
            'ResponseCode': '0',
            'ResponseDesc': 'Success. Request accepted for processing',
            'MerchantRequestID': merchant_id,
            'CheckoutRequestID': checkout_id,
            'CustomerMessage': 'Simulation: STK Push initiated successfully'
        }

