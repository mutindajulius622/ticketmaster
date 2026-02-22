from flask import current_app
import requests
from datetime import datetime
import json
import base64


class PayPalHandler:
    """PayPal integration handler"""
    
    def __init__(self):
        self.client_id = current_app.config.get('PAYPAL_CLIENT_ID')
        self.client_secret = current_app.config.get('PAYPAL_CLIENT_SECRET')
        self.environment = current_app.config.get('PAYPAL_ENVIRONMENT', 'sandbox')
        self.base_url = (
            'https://api-m.sandbox.paypal.com' if self.environment == 'sandbox'
            else 'https://api-m.paypal.com'
        )
    
    def get_access_token(self):
        """Get PayPal access token"""
        try:
            url = f"{self.base_url}/v1/oauth2/token"
            auth = (self.client_id, self.client_secret)
            headers = {'Accept': 'application/json', 'Accept-Language': 'en_US'}
            data = {'grant_type': 'client_credentials'}
            
            response = requests.post(url, auth=auth, headers=headers, data=data)
            if response.status_code == 200:
                return response.json().get('access_token')
            return None
        except Exception as e:
            current_app.logger.error(f"PayPal token error: {str(e)}")
            return None
    
    def create_order(self, amount, currency, reference, description, return_url):
        """Create PayPal order"""
        try:
            access_token = self.get_access_token()
            if not access_token:
                raise Exception("Failed to get access token")
            
            url = f"{self.base_url}/v2/checkout/orders"
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                'intent': 'CAPTURE',
                'purchase_units': [
                    {
                        'reference_id': reference,
                        'description': description,
                        'amount': {
                            'currency_code': currency,
                            'value': str(amount)
                        }
                    }
                ],
                'application_context': {
                    'brand_name': 'Ticket Master',
                    'landing_page': 'BILLING',
                    'user_action': 'PAY_NOW',
                    'return_url': return_url,
                    'cancel_url': f"{current_app.config.get('FRONTEND_URL')}/checkout?cancelled=true"
                }
            }
            
            response = requests.post(url, json=payload, headers=headers)
            
            if response.status_code == 201:
                data = response.json()
                return {
                    'success': True,
                    'data': data
                }
            else:
                return {
                    'success': False,
                    'error': response.json()
                }
        except Exception as e:
            current_app.logger.error(f"Order creation error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def capture_payment(self, order_id):
        """Capture PayPal payment"""
        try:
            access_token = self.get_access_token()
            if not access_token:
                raise Exception("Failed to get access token")
            
            url = f"{self.base_url}/v2/checkout/orders/{order_id}/capture"
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            response = requests.post(url, headers=headers, json={})
            
            if response.status_code == 201:
                return {
                    'success': True,
                    'data': response.json()
                }
            else:
                return {
                    'success': False,
                    'error': response.json()
                }
        except Exception as e:
            current_app.logger.error(f"Payment capture error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def refund_payment(self, capture_id, amount=None, currency='USD'):
        """Refund PayPal payment"""
        try:
            access_token = self.get_access_token()
            if not access_token:
                raise Exception("Failed to get access token")
            
            url = f"{self.base_url}/v2/payments/captures/{capture_id}/refund"
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            payload = {}
            if amount:
                payload = {
                    'amount': {
                        'value': str(amount),
                        'currency_code': currency
                    }
                }
            
            response = requests.post(url, json=payload, headers=headers)
            
            if response.status_code == 201:
                return {
                    'success': True,
                    'data': response.json()
                }
            else:
                return {
                    'success': False,
                    'error': response.json()
                }
        except Exception as e:
            current_app.logger.error(f"Refund error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_order_details(self, order_id):
        """Get PayPal order details"""
        try:
            access_token = self.get_access_token()
            if not access_token:
                raise Exception("Failed to get access token")
            
            url = f"{self.base_url}/v2/checkout/orders/{order_id}"
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                return response.json()
            return None
        except Exception as e:
            current_app.logger.error(f"Order details error: {str(e)}")
            return None
    
    def verify_webhook(self, webhook_data):
        """Verify PayPal webhook signature"""
        try:
            # In production, verify webhook signature
            # For now, just check for event type
            return webhook_data.get('event_type') in [
                'CHECKOUT.ORDER.APPROVED',
                'CHECKOUT.ORDER.COMPLETED',
                'PAYMENT.CAPTURE.COMPLETED',
                'PAYMENT.CAPTURE.REFUNDED'
            ]
        except Exception as e:
            current_app.logger.error(f"Webhook verification error: {str(e)}")
            return False


class EmailHandler:
    """Email service handler"""
    
    @staticmethod
    def send_verification_email(user_email, verification_link):
        """Send verification email"""
        from flask_mail import Mail, Message
        mail = Mail(current_app)
        
        msg = Message(
            subject='Verify Your Email - Ticket Master',
            recipients=[user_email],
            html=f"""
            <h2>Welcome to Ticket Master!</h2>
            <p>Please verify your email by clicking the link below:</p>
            <a href="{verification_link}">Verify Email</a>
            <p>If you didn't create this account, please ignore this email.</p>
            """
        )
        try:
            mail.send(msg)
            return True
        except Exception as e:
            current_app.logger.error(f"Email error: {str(e)}")
            return False
    
    @staticmethod
    def send_ticket_confirmation(user_email, event_title, ticket_number):
        """Send ticket confirmation email"""
        from flask_mail import Mail, Message
        mail = Mail(current_app)
        
        msg = Message(
            subject=f'Ticket Confirmation - {event_title}',
            recipients=[user_email],
            html=f"""
            <h2>Your Ticket is Confirmed!</h2>
            <p>Event: {event_title}</p>
            <p>Ticket Number: {ticket_number}</p>
            <p>Please download your ticket from your account dashboard.</p>
            """
        )
        try:
            mail.send(msg)
            return True
        except Exception as e:
            current_app.logger.error(f"Email error: {str(e)}")
            return False
