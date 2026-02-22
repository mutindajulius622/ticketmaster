import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createPayPalOrder, capturePayPalOrder, clearCurrentOrder } from '../redux/slices/paymentsSlice';
import paymentService from '../services/paymentService';
import { fetchEventDetail } from '../redux/slices/eventsSlice';

const CheckoutPage = () => {
  const params = useParams();
  const routeTicketTypeId = params.ticketTypeId || params.eventId;
  const urlParams = new URLSearchParams(window.location.search);
  const queryEventId = urlParams.get('eventId');
  const eventId = queryEventId || routeTicketTypeId;
  const selectedSeats = useSelector(state => state.selectedSeats.selected || []);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [paymentId, setPaymentId] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [ticketType, setTicketType] = useState(null);

  const { currentEvent } = useSelector(state => state.events);
  const { currentOrder, loading, error } = useSelector(state => state.payments);

  useEffect(() => {
    if (eventId && !currentEvent?.id) {
      dispatch(fetchEventDetail(eventId));
    }
  }, [eventId, currentEvent?.id, dispatch]);

  const handleCreateOrder = async () => {
    try {
      // Create payment record on backend first
      const urlParams = new URLSearchParams(window.location.search);
      const seatsParam = urlParams.get('seats');
      const seat_ids = seatsParam ? seatsParam.split(',') : [];

      const payload = {
        event_id: eventId,
        ticket_type_id: ticketType?.id,
        quantity,
        seat_ids,
        currency: 'USD',
        description: `Purchase ${quantity} x ${ticketType?.name} for ${currentEvent.title}`,
      };

      const resp = await paymentService.createPayment(payload);
      const paymentId = resp.payment_id || resp.payment?.id;
      if (!paymentId) throw new Error('Failed to create payment');

      const result = await dispatch(createPayPalOrder(paymentId)).unwrap();
      if (result.approve_link) {
        // Redirect to PayPal for approval
        window.location.href = result.approve_link;
      }
    } catch (err) {
      console.error('Order creation failed:', err);
      alert('Failed to create order');
    }
  };

  useEffect(() => {
    // Handle PayPal return
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('token');
    const cancelled = urlParams.get('cancelled');

    if (cancelled) {
      alert('Payment was cancelled');
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (orderId && paymentId) {
      // Automatically capture the order
      dispatch(capturePayPalOrder(orderId)).then((result) => {
        if (result.type === 'payments/capturePayPalOrder/fulfilled') {
          alert('Payment successful!');
          navigate(`/dashboard`);
        }
      });
    }
  }, [dispatch, navigate, paymentId]);

  if (!currentEvent) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center">
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Order Summary</h2>
            <div className="border-b pb-4 mb-4">
              <h3 className="font-semibold text-lg">{currentEvent.title}</h3>
              <p className="text-gray-600 text-sm">{currentEvent.location}</p>
              <p className="text-gray-600 text-sm">
                {new Date(currentEvent.start_date).toLocaleDateString()}
              </p>
            </div>

            {/* Ticket Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-3">Select Ticket Type</label>
              {currentEvent.ticket_types?.map((type) => (
                <div
                  key={type.id}
                  className="flex items-center p-3 border rounded-lg mb-2 cursor-pointer hover:bg-gray-50"
                  onClick={() => {
                    setTicketType(type);
                    setPaymentId(`ticket_${type.id}`);
                  }}
                >
                  <input
                    type="radio"
                    name="ticket_type"
                    checked={ticketType?.id === type.id}
                    onChange={() => setTicketType(type)}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <p className="font-semibold">{type.name}</p>
                    <p className="text-sm text-gray-600">{type.description}</p>
                  </div>
                  <p className="font-bold text-lg">${type.price}</p>
                </div>
              ))}
            </div>

            {/* Quantity Selection */}
            {ticketType && (
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Quantity</label>
                <input
                  type="number"
                  min="1"
                  max={ticketType.available_quantity}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Available: {ticketType.available_quantity}
                </p>
              </div>
            )}

            {/* Total */}
            {ticketType && (
              <div className="border-t pt-4">
                <div className="flex justify-between mb-2">
                  <span>Subtotal:</span>
                  <span>${(ticketType.price * quantity).toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Fees:</span>
                  <span>${(ticketType.price * quantity * 0.02).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold mt-4 pt-4 border-t">
                  <span>Total:</span>
                  <span>${(ticketType.price * quantity * 1.02).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Payment Method</h2>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            {/* PayPal Button */}
            <div className="mb-6">
              <button
                onClick={handleCreateOrder}
                disabled={!ticketType || loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg mb-4"
              >
                {loading ? 'Processing...' : 'Pay with PayPal'}
              </button>
              <p className="text-xs text-gray-600 text-center">
                You will be redirected to PayPal to complete the payment securely.
              </p>
            </div>

            {/* Security Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">🔒 Secure Payment</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ Encrypted payment processing</li>
                <li>✓ Trusted by PayPal</li>
                <li>✓ No credit card info stored</li>
                <li>✓ Buyer protection included</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
