from marshmallow import Schema, fields, validates, ValidationError
from marshmallow_enum import EnumField
from app.models import PropertyType, PropertyStatus


class PropertyCreateSchema(Schema):
    """Schema for creating a new property."""
    name = fields.Str(required=True, validate=lambda x: len(x.strip()) > 0)
    type = EnumField(PropertyType, required=True)
    address = fields.Str(required=True, validate=lambda x: len(x.strip()) > 0)
    city = fields.Str(required=True, validate=lambda x: len(x.strip()) > 0)
    state = fields.Str(required=True, validate=lambda x: len(x.strip()) > 0)
    zip_code = fields.Str(required=True, validate=lambda x: len(x.strip()) > 0)
    country = fields.Str(default='Kenya')
    description = fields.Str()
    bedrooms = fields.Int(required=True, validate=lambda x: x > 0)
    bathrooms = fields.Int(required=True, validate=lambda x: x > 0)
    square_feet = fields.Int(validate=lambda x: x > 0 if x else True)
    year_built = fields.Int(validate=lambda x: x > 1800 and x <= 2024 if x else True)
    amenities = fields.List(fields.Str())
    features = fields.Dict()
    monthly_rent = fields.Decimal(places=2, validate=lambda x: x >= 0 if x else True)
    purchase_price = fields.Decimal(places=2, validate=lambda x: x >= 0 if x else True)
    security_deposit = fields.Decimal(places=2, validate=lambda x: x >= 0 if x else True)
    property_tax = fields.Decimal(places=2, validate=lambda x: x >= 0 if x else True)
    is_listed = fields.Bool(default=False)
    manager_id = fields.Str()
    
    @validates('type')
    def validate_type(self, value):
        if value not in PropertyType:
            raise ValidationError('Invalid property type')


class PropertyUpdateSchema(Schema):
    """Schema for updating property information."""
    name = fields.Str(validate=lambda x: len(x.strip()) > 0)
    address = fields.Str(validate=lambda x: len(x.strip()) > 0)
    city = fields.Str(validate=lambda x: len(x.strip()) > 0)
    state = fields.Str(validate=lambda x: len(x.strip()) > 0)
    zip_code = fields.Str(validate=lambda x: len(x.strip()) > 0)
    country = fields.Str()
    description = fields.Str()
    bedrooms = fields.Int(validate=lambda x: x > 0)
    bathrooms = fields.Int(validate=lambda x: x > 0)
    square_feet = fields.Int(validate=lambda x: x > 0 if x else True)
    year_built = fields.Int(validate=lambda x: x > 1800 and x <= 2024 if x else True)
    amenities = fields.List(fields.Str())
    features = fields.Dict()
    monthly_rent = fields.Decimal(places=2, validate=lambda x: x >= 0 if x else True)
    purchase_price = fields.Decimal(places=2, validate=lambda x: x >= 0 if x else True)
    security_deposit = fields.Decimal(places=2, validate=lambda x: x >= 0 if x else True)
    property_tax = fields.Decimal(places=2, validate=lambda x: x >= 0 if x else True)
    status = EnumField(PropertyStatus)
    is_listed = fields.Bool()
    manager_id = fields.Str()


class PropertySchema(Schema):
    """Schema for property responses."""
    id = fields.Str(dump_only=True)
    name = fields.Str(dump_only=True)
    type = EnumField(PropertyType, dump_only=True)
    address = fields.Str(dump_only=True)
    city = fields.Str(dump_only=True)
    state = fields.Str(dump_only=True)
    zip_code = fields.Str(dump_only=True)
    country = fields.Str(dump_only=True)
    description = fields.Str(dump_only=True)
    bedrooms = fields.Int(dump_only=True)
    bathrooms = fields.Int(dump_only=True)
    square_feet = fields.Int(dump_only=True)
    year_built = fields.Int(dump_only=True)
    amenities = fields.List(fields.Str(), dump_only=True)
    features = fields.Dict(dump_only=True)
    monthly_rent = fields.Decimal(places=2, dump_only=True)
    purchase_price = fields.Decimal(places=2, dump_only=True)
    security_deposit = fields.Decimal(places=2, dump_only=True)
    property_tax = fields.Decimal(places=2, dump_only=True)
    status = EnumField(PropertyStatus, dump_only=True)
    is_listed = fields.Bool(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
    
    # Nested relationships
    owner = fields.Nested(lambda: UserSchema(only=('id', 'first_name', 'last_name', 'email')), dump_only=True)
    manager = fields.Nested(lambda: UserSchema(only=('id', 'first_name', 'last_name', 'email')), dump_only=True)
    photos = fields.List(fields.Nested(lambda: PropertyPhotoSchema()), dump_only=True)


class PropertyPhotoSchema(Schema):
    """Schema for property photos."""
    id = fields.Str(dump_only=True)
    url = fields.Url(dump_only=True)
    is_primary = fields.Bool(dump_only=True)
    description = fields.Str(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
