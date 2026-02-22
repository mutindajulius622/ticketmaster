"""
URLs package for the Palmer Living Reality server.

This package contains route initialization functions and configurations
for the Flask application.
"""

from flask_restful import Api
from server.main import (
    AuthRegister,
    AuthLogin,
    AuthLogout,
    AuthCheck,
    Users,
    UserById,
    Properties,
    PropertyById,
    RentalAgreements,
    RentalAgreementById,
    VerifyTenant,
    PendingTenants,
    Amenities,
    PropertyAmenities,
    InitiatePayment,
    PaymentStatus,
    Payments,
    MpesaCallback,
    Inquiries,
    InquiryById,
    PropertyInquiries,
    MyInquiries
)


def initialize_routes(api: Api):
    """
    Initialize all API routes for the application.
    
    Args:
        api: Flask-RESTful Api instance
    """
    # Auth routes
    api.add_resource(AuthRegister, '/api/register')
    api.add_resource(AuthLogin, '/api/login')
    api.add_resource(AuthLogout, '/api/logout')
    api.add_resource(AuthCheck, '/api/me')
    
    # User routes
    api.add_resource(Users, '/api/users')
    api.add_resource(UserById, '/api/users/<int:user_id>')
    
    # Property routes
    api.add_resource(Properties, '/api/properties')
    api.add_resource(PropertyById, '/api/properties/<int:property_id>')
    
    # Rental agreement routes
    api.add_resource(RentalAgreements, '/api/rental-agreements')
    api.add_resource(RentalAgreementById, '/api/rental-agreements/<int:agreement_id>')
    
    # Admin routes
    api.add_resource(VerifyTenant, '/api/verify-tenant/<int:user_id>')
    api.add_resource(PendingTenants, '/api/pending-tenants')
    
    # Amenity routes
    api.add_resource(Amenities, '/api/amenities')
    api.add_resource(PropertyAmenities, '/api/properties/<int:property_id>/amenities')
    
    # Payment routes
    api.add_resource(InitiatePayment, '/api/payments/initiate')
    api.add_resource(PaymentStatus, '/api/payments/<int:payment_id>/status')
    api.add_resource(Payments, '/api/payments')
    api.add_resource(MpesaCallback, '/api/mpesa/callback')
    
    # Inquiry routes
    api.add_resource(Inquiries, '/api/inquiries')
    api.add_resource(InquiryById, '/api/inquiries/<int:inquiry_id>')
    api.add_resource(PropertyInquiries, '/api/properties/<int:property_id>/inquiries')
    api.add_resource(MyInquiries, '/api/my-inquiries')


__all__ = ['initialize_routes']

