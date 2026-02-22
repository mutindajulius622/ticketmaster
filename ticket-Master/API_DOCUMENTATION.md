# Ticket Master API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All authenticated endpoints require JWT Bearer token in the Authorization header:
```
Authorization: Bearer {access_token}
```

## Response Format
All responses are in JSON format with the following structure:
```json
{
  "message": "Success message",
  "data": { }
}
```

---

## 📋 Table of Contents
1. [Authentication](#authentication)
2. [Events](#events)
3. [Tickets](#tickets)
4. [Payments](#payments)
5. [Admin](#admin)
6. [Error Handling](#error-handling)

---

## Authentication

### POST /auth/register
Register a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe",
  "phone_number": "+254712345678",
  "role": "attendee"
}
```

**Response:** `201 Created`
```json
{
  "message": "User registered successfully",
  "user": { }
}
```

---

### POST /auth/login
Authenticate user and get access token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "message": "Login successful",
  "access_token": "eyJ0eXAi...",
  "user": { }
}
```

---

### GET /auth/me
Get current authenticated user. *Requires authentication*

**Response:** `200 OK`
```json
{
  "user": { }
}
```

---

### POST /auth/change-password
Change user password. *Requires authentication*

**Request:**
```json
{
  "current_password": "OldPass123!",
  "new_password": "NewPass123!"
}
```

**Response:** `200 OK`
```json
{
  "message": "Password changed successfully"
}
```

---

## Events

### GET /events
List all published events with pagination and filtering.

**Query Parameters:**
- `page` (int, default: 1) - Page number
- `limit` (int, default: 10) - Items per page
- `category` (string) - Filter by category
- `location` (string) - Filter by location
- `search` (string) - Search in title/description
- `status` (string, default: 'published') - Event status

**Response:** `200 OK`
```json
{
  "events": [ { } ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

---

### GET /events/:eventId
Get event details by ID.

**Response:** `200 OK`
```json
{
  "id": "event-id",
  "title": "Amazing Concert",
  "description": "...",
  "category": "music",
  "location": "Nairobi, Kenya",
  "start_date": "2024-12-31T18:00:00",
  "end_date": "2024-12-31T23:00:00",
  "image_url": "...",
  "status": "published",
  "total_attendees": 100,
  "average_rating": 4.5,
  "ticket_types": [ { } ],
  "organizer": { }
}
```

---

### POST /events
Create new event. *Requires authentication (Organizer/Admin)*

**Request:**
```json
{
  "title": "Tech Conference 2024",
  "description": "Annual tech conference",
  "category": "technology",
  "location": "Nairobi, Kenya",
  "latitude": -1.2865,
  "longitude": 36.8172,
  "start_date": "2024-12-31T09:00:00",
  "end_date": "2024-12-31T17:00:00",
  "image_url": "https://...",
  "tags": ["tech", "conference", "2024"]
}
```

**Response:** `201 Created`
```json
{
  "message": "Event created successfully",
  "event": { }
}
```

---

### PUT /events/:eventId
Update event. *Requires authentication (Event Organizer)*

**Request:** Same as POST /events

**Response:** `200 OK`
```json
{
  "message": "Event updated successfully",
  "event": { }
}
```

---

### DELETE /events/:eventId
Delete event. *Requires authentication (Event Organizer)*

**Response:** `200 OK`
```json
{
  "message": "Event deleted successfully"
}
```

---

### POST /events/:eventId/ticket-types
Create ticket type. *Requires authentication (Event Organizer)*

**Request:**
```json
{
  "name": "Early Bird",
  "type": "early_bird",
  "price": 2000,
  "quantity": 100,
  "description": "Get 30% discount",
  "start_sale": "2024-11-01T00:00:00",
  "end_sale": "2024-12-15T23:59:59"
}
```

**Response:** `201 Created`
```json
{
  "message": "Ticket type created successfully",
  "ticket_type": { }
}
```

---

### GET /events/:eventId/reviews
Get event reviews.

**Response:** `200 OK`
```json
{
  "reviews": [ { } ],
  "average_rating": 4.5,
  "total_reviews": 25
}
```

---

### POST /events/:eventId/reviews
Create review. *Requires authentication (Event Attendee)*

**Request:**
```json
{
  "rating": 5,
  "title": "Excellent Event!",
  "comment": "Amazing organization and great atmosphere"
}
```

**Response:** `201 Created`
```json
{
  "message": "Review created successfully",
  "review": { }
}
```

---

## Tickets

### GET /tickets
Get user's tickets. *Requires authentication*

**Query Parameters:**
- `page` (int, default: 1)
- `limit` (int, default: 10)

**Response:** `200 OK`
```json
{
  "tickets": [ { } ],
  "pagination": { }
}
```

---

### GET /tickets/:ticketId
Get ticket details. *Requires authentication*

**Response:** `200 OK`
```json
{
  "id": "ticket-id",
  "ticket_number": "TKT-20240115-ABC123",
  "event": { },
  "ticket_type": { },
  "price": 2500,
  "status": "confirmed",
  "qr_code": "data:image/png;base64,...",
  "used_at": null
}
```

---

### POST /tickets
Purchase tickets. *Requires authentication*

**Request:**
```json
{
  "ticket_type_id": "type-id",
  "quantity": 2,
  "payment_method": "paypal"
}
```

**Response:** `201 Created`
```json
{
  "message": "Tickets created successfully, awaiting payment confirmation",
  "payment": { },
  "tickets": [ { } ]
}
```

---

### POST /tickets/:ticketId/cancel
Cancel ticket. *Requires authentication*

**Response:** `200 OK`
```json
{
  "message": "Ticket cancelled successfully",
  "ticket": { }
}
```

---

### GET /tickets/:ticketId/download
Download ticket with QR code. *Requires authentication*

**Response:** `200 OK` (PDF or JSON with base64 QR)
```json
{
  "ticket_number": "...",
  "qr_code_data": "data:image/png;base64,...",
  "event": { }
}
```

---

### POST /tickets/:ticketId/validate
Validate/scan ticket. *Requires authentication (Event Staff)*

**Response:** `200 OK`
```json
{
  "message": "Ticket validated successfully",
  "ticket": { }
}
```

---

## Payments

### POST /payments/paypal/create-order
Create a PayPal order. *Requires authentication*

**Request:**
```json
{
  "payment_id": "payment-id"
}
```

**Response:** `201 Created`
```json
{
  "message": "Order created successfully",
  "order_id": "paypal-order-id",
  "approve_link": "https://www.sandbox.paypal.com/checkoutnow?token=...",
  "data": { }
}
```

---

### POST /payments/paypal/capture-order
Capture an approved PayPal order. *Requires authentication*

**Request:**
```json
{
  "order_id": "paypal-order-id"
}
```

**Response:** `200 OK`
```json
{
  "message": "Payment captured successfully",
  "payment": { },
  "tickets": [ { } ]
}
```

---

### POST /payments/paypal/callback
PayPal webhook callback endpoint. (Called by PayPal - not for direct use)

---

### GET /payments/:paymentId/status
Get payment status. *Requires authentication*

**Response:** `200 OK`
```json
{
  "payment": { },
  "tickets": [ { } ]
}
```

---

### GET /payments
Get user's payments. *Requires authentication*

**Query Parameters:**
- `page` (int, default: 1)
- `limit` (int, default: 10)

**Response:** `200 OK`
```json
{
  "payments": [ { } ],
  "pagination": { }
}
```

---

### POST /payments/:paymentId/refund
Refund payment. *Requires authentication*

**Response:** `200 OK`
```json
{
  "message": "Payment refunded successfully",
  "payment": { }
}
```

---

## Admin

### GET /admin/users
List all users. *Requires authentication (Admin only)*

**Query Parameters:**
- `page` (int, default: 1)
- `limit` (int, default: 10)
- `role` (string) - Filter by role
- `status` (string) - Filter by status
- `search` (string) - Search by email/name

**Response:** `200 OK`
```json
{
  "users": [ { } ],
  "pagination": { }
}
```

---

### PUT /admin/users/:userId/role
Update user role. *Requires authentication (Admin only)*

**Request:**
```json
{
  "role": "organizer"
}
```

**Response:** `200 OK`
```json
{
  "message": "User role updated successfully",
  "user": { }
}
```

---

### PUT /admin/users/:userId/status
Update user status. *Requires authentication (Admin only)*

**Request:**
```json
{
  "status": "banned"
}
```

**Response:** `200 OK`
```json
{
  "message": "User status updated successfully",
  "user": { }
}
```

---

### GET /admin/events
List all events. *Requires authentication (Admin only)*

**Query Parameters:**
- `page` (int, default: 1)
- `limit` (int, default: 10)
- `status` (string)

**Response:** `200 OK`
```json
{
  "events": [ { } ],
  "pagination": { }
}
```

---

### POST /admin/events/:eventId/approve
Approve event. *Requires authentication (Admin only)*

**Response:** `200 OK`
```json
{
  "message": "Event approved successfully",
  "event": { }
}
```

---

### POST /admin/events/:eventId/reject
Reject event. *Requires authentication (Admin only)*

**Request:**
```json
{
  "reason": "Inappropriate content"
}
```

**Response:** `200 OK`
```json
{
  "message": "Event rejected successfully",
  "event": { }
}
```

---

### GET /admin/analytics
Get platform analytics. *Requires authentication (Admin only)*

**Query Parameters:**
- `days` (int, default: 30) - Period in days

**Response:** `200 OK`
```json
{
  "users": {
    "total": 500,
    "organizers": 50,
    "attendees": 450,
    "new": 25
  },
  "events": {
    "total": 100,
    "published": 80,
    "new": 10
  },
  "payments": {
    "total_revenue": 250000,
    "completed_payments": 120
  },
  "tickets": {
    "total_sold": 500
  },
  "period": {
    "days": 30,
    "start_date": "2024-01-01T00:00:00",
    "end_date": "2024-01-31T23:59:59"
  }
}
```

---

### GET /admin/reports/revenue
Get revenue report. *Requires authentication (Admin only)*

**Query Parameters:**
- `days` (int, default: 30)

**Response:** `200 OK`
```json
{
  "total_revenue": 250000,
  "by_method": {
    "paypal": 250000
  },
  "payment_count": 120,
  "period_days": 30
}
```

---

## Error Handling

### Error Response Format
```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

### Common Status Codes
| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 500 | Internal Server Error |

### Example Errors
```json
{
  "error": "Unauthorized",
  "message": "Invalid email or password"
}
```

```json
{
  "error": "Forbidden",
  "message": "You do not have permission to access this resource"
}
```

```json
{
  "error": "Not Found",
  "message": "Event not found"
}
```

---

## Rate Limiting
- Rate limits: 100 requests per minute (recommended)
- Implemented via WSGI middleware

## Caching
- GET endpoints can be cached (300s recommended)
- POST/PUT/DELETE requests not cached

## Versioning
- Current API version: v1
- Future: `/api/v2/...`

---

**Last Updated:** January 2024
**API Version:** 1.0.0
