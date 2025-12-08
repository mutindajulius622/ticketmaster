import re
from email_validator import validate_email as validate_email_lib, EmailNotValidError


def validate_email(email: str) -> bool:
    """Validate email format."""
    try:
        validate_email_lib(email)
        return True
    except EmailNotValidError:
        return False


def validate_password(password: str) -> bool:
    """Validate password strength."""
    if len(password) < 8:
        return False

    # Check for at least one letter and one number
    has_letter = bool(re.search(r'[a-zA-Z]', password))
    has_number = bool(re.search(r'\d', password))

    return has_letter and has_number


def validate_phone(phone: str) -> bool:
    """Validate phone number format."""
    # Basic phone validation - can be enhanced
    if not phone:
        return True  # Phone is optional

    # Remove spaces, dashes, parentheses
    cleaned = re.sub(r'[\s\-\(\)]', '', phone)

    # Check if it's a valid number
    if not cleaned.isdigit():
        return False

    # Check length (basic validation)
    return 7 <= len(cleaned) <= 15


def validate_property_data(data: dict) -> tuple[bool, str]:
    """Validate property creation/update data."""
    required_fields = ['name', 'type', 'address', 'city', 'state', 'zip_code', 'bedrooms', 'bathrooms']

    for field in required_fields:
        if field not in data or not data[field]:
            return False, f'{field.replace("_", " ").title()} is required'

    # Validate bedrooms and bathrooms
    try:
        bedrooms = int(data['bedrooms'])
        bathrooms = float(data['bathrooms'])

        if bedrooms < 0 or bathrooms < 0:
            return False, 'Bedrooms and bathrooms must be positive numbers'
    except (ValueError, TypeError):
        return False, 'Bedrooms and bathrooms must be valid numbers'

    return True, ''


def validate_lease_data(data: dict) -> tuple[bool, str]:
    """Validate lease creation data."""
    required_fields = ['property_id', 'tenant_id', 'start_date', 'end_date', 'monthly_rent', 'security_deposit']

    for field in required_fields:
        if field not in data:
            return False, f'{field.replace("_", " ").title()} is required'

    # Validate dates
    from datetime import datetime
    try:
        start_date = datetime.fromisoformat(data['start_date']).date()
        end_date = datetime.fromisoformat(data['end_date']).date()

        if start_date >= end_date:
            return False, 'End date must be after start date'
    except (ValueError, TypeError):
        return False, 'Invalid date format'

    # Validate amounts
    try:
        monthly_rent = float(data['monthly_rent'])
        security_deposit = float(data['security_deposit'])

        if monthly_rent <= 0 or security_deposit < 0:
            return False, 'Rent and security deposit must be positive numbers'
    except (ValueError, TypeError):
        return False, 'Monthly rent and security deposit must be valid numbers'

    return True, ''
