from marshmallow import Schema, fields, validate, ValidationError


class UserSchema(Schema):
    """User data schema"""
    id = fields.Str(dump_only=True)
    email = fields.Email(required=True)
    first_name = fields.Str(required=True, validate=validate.Length(min=2, max=80))
    last_name = fields.Str(required=True, validate=validate.Length(min=2, max=80))
    phone_number = fields.Str(allow_none=True)
    password = fields.Str(required=True, load_only=True)
    profile_picture = fields.Str(allow_none=True)
    bio = fields.Str(allow_none=True)
    role = fields.Str(validate=validate.OneOf(['admin', 'organizer', 'attendee']))
    status = fields.Str(validate=validate.OneOf(['active', 'inactive', 'banned']))
    email_verified = fields.Boolean(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
    full_name = fields.Str(dump_only=True)


class EventSchema(Schema):
    """Event data schema"""
    id = fields.Str(dump_only=True)
    title = fields.Str(required=True, validate=validate.Length(min=3, max=255))
    description = fields.Str(required=True)
    category = fields.Str(validate=validate.OneOf([
        'music', 'sports', 'technology', 'business', 'entertainment', 'education', 'health', 'other'
    ]))
    location = fields.Str(required=True)
    latitude = fields.Float(allow_none=True)
    longitude = fields.Float(allow_none=True)
    start_date = fields.DateTime(required=True)
    end_date = fields.DateTime(required=True)
    image_url = fields.Str(allow_none=True)
    status = fields.Str(validate=validate.OneOf(['draft', 'published', 'ongoing', 'completed', 'cancelled']))
    organizer_id = fields.Str(dump_only=True)
    total_attendees = fields.Int(dump_only=True)
    average_rating = fields.Float(dump_only=True)
    tags = fields.List(fields.Str())
    is_featured = fields.Boolean()
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class TicketTypeSchema(Schema):
    """Ticket type schema"""
    id = fields.Str(dump_only=True)
    event_id = fields.Str(required=True)
    name = fields.Str(required=True, validate=validate.Length(min=2, max=100))
    type = fields.Str(required=True, validate=validate.OneOf(['early_bird', 'vip', 'regular']))
    price = fields.Float(required=True, validate=validate.Range(min=0))
    quantity = fields.Int(required=True, validate=validate.Range(min=1))
    sold = fields.Int(dump_only=True)
    available = fields.Int(dump_only=True)
    description = fields.Str(allow_none=True)
    start_sale = fields.DateTime(allow_none=True)
    end_sale = fields.DateTime(allow_none=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class TicketSchema(Schema):
    """Ticket schema"""
    id = fields.Str(dump_only=True)
    event_id = fields.Str(required=True)
    ticket_type_id = fields.Str(required=True)
    attendee_id = fields.Str(dump_only=True)
    payment_id = fields.Str(allow_none=True)
    ticket_number = fields.Str(dump_only=True)
    price = fields.Float(dump_only=True)
    status = fields.Str(validate=validate.OneOf(['pending', 'confirmed', 'used', 'cancelled', 'refunded']))
    qr_code = fields.Str(dump_only=True)
    used_at = fields.DateTime(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class PaymentSchema(Schema):
    """Payment schema"""
    id = fields.Str(dump_only=True)
    user_id = fields.Str(dump_only=True)
    amount = fields.Float(required=True, validate=validate.Range(min=0.01))
    currency = fields.Str(default='KES')
    method = fields.Str(required=True, validate=validate.OneOf(['mpesa', 'card', 'bank_transfer']))
    status = fields.Str(validate=validate.OneOf(['pending', 'completed', 'failed', 'refunded']))
    transaction_id = fields.Str(dump_only=True)
    mpesa_receipt = fields.Str(dump_only=True, allow_none=True)
    description = fields.Str(allow_none=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class ReviewSchema(Schema):
    """Review schema"""
    id = fields.Str(dump_only=True)
    event_id = fields.Str(required=True)
    reviewer_id = fields.Str(dump_only=True)
    rating = fields.Int(required=True, validate=validate.Range(min=1, max=5))
    title = fields.Str(allow_none=True)
    comment = fields.Str(allow_none=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
