# Payment System Migration: MPESA to PayPal

## Overview
This guide documents the migration from MPESA STK Push payment integration to PayPal payment processing in the Ticket Master application.

## What Changed

### Backend Changes

#### 1. **Integrations Module** (`app/utils/integrations.py`)
- **Removed**: `MpesaHandler` class
- **Added**: `PayPalHandler` class with the following methods:
  - `get_access_token()` - Get OAuth2 access token from PayPal
  - `create_order()` - Create a PayPal order
  - `capture_payment()` - Capture an approved PayPal order
  - `refund_payment()` - Process refunds
  - `get_order_details()` - Retrieve order information
  - `verify_webhook()` - Verify PayPal webhook signatures

#### 2. **Payment Routes** (`app/routes/payments.py`)
**Old Endpoints:**
- `POST /api/payments/mpesa/initiate` - Initiate STK push
- `POST /api/payments/mpesa/callback` - Handle MPESA callbacks

**New Endpoints:**
- `POST /api/payments/paypal/create-order` - Create PayPal order
- `POST /api/payments/paypal/capture-order` - Capture order after approval
- `POST /api/payments/paypal/callback` - Handle PayPal webhooks

**Unchanged Endpoints:**
- `GET /api/payments` - Get user payments
- `GET /api/payments/:id/status` - Get payment status
- `POST /api/payments/:id/refund` - Refund payment

#### 3. **Dependencies** (`requirements.txt`)
- **Added**: `paypalrestsdk==1.7.1`
- No MPESA-specific packages removed (they were using generic `requests` library)

#### 4. **Configuration** (`.env.example`)
**Removed:**
```
MPESA_SHORTCODE=
MPESA_PASSKEY=
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_ENVIRONMENT=
```

**Added:**
```
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_ENVIRONMENT=sandbox
```

**Added:**
```
API_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
```

### Frontend Changes

#### 1. **Payment Service** (`src/services/paymentService.js`)
**Removed Methods:**
- `initiateMpesaPayment()` - STK push initiation

**Added Methods:**
- `createPayPalOrder()` - Create PayPal order
- `capturePayPalOrder()` - Capture PayPal order

**Unchanged:**
- `getUserPayments()`
- `getPaymentStatus()`
- `refundPayment()`

#### 2. **Redux Payments Slice** (`src/redux/slices/paymentsSlice.js`)
**Removed Thunks:**
- `initiateMpesaPayment`

**Added Thunks:**
- `createPayPalOrder`
- `capturePayPalOrder`

**Added State:**
- `currentOrder` - Stores PayPal order details

**Added Actions:**
- `clearCurrentOrder()` - Clear current order from state

#### 3. **Checkout Page** (`src/pages/CheckoutPage.jsx`)
- **Complete rewrite** to support PayPal flow
- Features:
  - Ticket type selection
  - Quantity selection
  - Order summary with totals
  - PayPal payment button
  - Automatic order capture on return
  - Error handling and loading states

#### 4. **Dependencies** (`package.json`)
- **Added**: `@paypal/checkout-server-sdk==1.0.1`

## Payment Flow Comparison

### MPESA Flow (Old)
1. User selects ticket
2. Enter phone number
3. API initiates STK push
4. User confirms on phone
5. MPESA callback updates ticket status

### PayPal Flow (New)
1. User selects ticket and quantity
2. Click "Pay with PayPal"
3. Order created on backend
4. User redirected to PayPal
5. User approves payment
6. Backend captures order
7. Tickets confirmed automatically

## Configuration Steps

### Backend Setup

1. **Get PayPal Credentials**
   - Go to [PayPal Developer Dashboard](https://developer.paypal.com/)
   - Create an app or use existing
   - Copy Client ID and Secret

2. **Update `.env`**
   ```bash
   PAYPAL_CLIENT_ID=your_client_id
   PAYPAL_CLIENT_SECRET=your_client_secret
   PAYPAL_ENVIRONMENT=sandbox  # or production
   API_URL=http://localhost:5000
   FRONTEND_URL=http://localhost:3000
   ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

### Frontend Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Update `.env`** (if using PayPal client-side SDK)
   - Client SDK is handled server-side for security

## Database Migrations

### No Changes Required

The `Payment` model and database schema remain the same. The `metadata` field is flexible JSON that stores:
- **Old**: `paypal_order_id`, `paypal_order_data`, `paypal_capture_id`
- All stored in the same metadata field as before

### Payment Model Structure
```python
class Payment:
    id = Column(UUID, primary_key=True)
    user_id = Column(UUID, ForeignKey('user.id'))
    amount = Column(Float)
    currency = Column(String(3), default='USD')  # Now supports PayPal currencies
    status = Column(String(20))
    metadata = Column(JSON)  # Stores PayPal order info
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
```

## Testing Paypal Integration

### Sandbox Testing

```bash
# 1. Start backend
python wsgi.py

# 2. Create order
curl -X POST http://localhost:5000/api/payments/paypal/create-order \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"payment_id": "payment-id"}'

# 3. Approve order on PayPal (visit approve_link)

# 4. Capture order
curl -X POST http://localhost:5000/api/payments/paypal/capture-order \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"order_id": "order-id"}'
```

### Webhook Testing

Use [PayPal Webhook Simulator](https://developer.paypal.com/tools/sandbox/):
1. Go to Dashboard > Webhooks
2. Create webhook URL: `http://your-domain/api/payments/paypal/callback`
3. Subscribe to events:
   - PAYMENT.CAPTURE.COMPLETED
   - PAYMENT.CAPTURE.REFUNDED

## Rollback Plan

If you need to revert to MPESA:

1. **Git Revert**
   ```bash
   git revert <commit-hash>
   ```

2. **Manual Revert**
   - Restore `MpesaHandler` from git history
   - Update payment routes back to `/mpesa/initiate`
   - Revert frontend services
   - Restore .env configurations

## Breaking Changes

| Item | Old | New |
|------|-----|-----|
| Payment Initiation | Phone number required | Order ID required |
| Redirect Flow | STK on phone | Web browser |
| User Experience | Modal on device | Full page redirect |
| Webhook URL | `/mpesa/callback` | `/paypal/callback` |
| Environment Vars | `MPESA_*` | `PAYPAL_*` |

## Performance Considerations

- **MPESA**: Direct phone integration, faster user experience on mobile
- **PayPal**: Web-based flow, better for desktop, international support

## Security Considerations

### PayPal Integration
- Client Secret never exposed to frontend
- Orders created server-side only
- Webhooks verified on backend
- No payment data stored locally

## Support & Resources

- [PayPal REST API Docs](https://developer.paypal.com/api/rest/)
- [PayPal Sandbox Testing](https://developer.paypal.com/tools/sandbox/)
- [PayPal SDK Python](https://github.com/paypal/PayPal-Python-SDK)

## Troubleshooting

### Common Issues

**Issue**: "Invalid client ID"
- **Solution**: Verify `PAYPAL_CLIENT_ID` in `.env`

**Issue**: "Order not found"
- **Solution**: Ensure order is created before capturing

**Issue**: "CORS error"
- **Solution**: Check `CORS_ORIGINS` in backend `.env`

**Issue**: "Webhook not received"
- **Solution**: Configure webhook in PayPal Dashboard, ensure public URL

## Migration Checklist

- [ ] Back up database
- [ ] Update backend `.env` with PayPal credentials
- [ ] Run `pip install -r requirements.txt`
- [ ] Run `npm install` in frontend
- [ ] Test payment flow in sandbox
- [ ] Configure PayPal webhook
- [ ] Deploy to production
- [ ] Monitor payment transactions
- [ ] Remove MPESA credentials from production

## Contact & Support

For issues or questions about the migration:
1. Check this guide
2. Review API documentation
3. Test in sandbox environment
4. Check logs for error details

---

**Last Updated**: February 2026
**Status**: Stable
