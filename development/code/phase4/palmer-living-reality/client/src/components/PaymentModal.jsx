import { useState } from 'react';
import { paymentService } from '../services/api';

function PaymentModal({ rentalAgreement, onClose, onSuccess }) {
  const [paymentMethod, setPaymentMethod] = useState('mpesa_stk_push');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState(rentalAgreement?.rent_amount || '');
  const [description, setDescription] = useState('Rent Payment');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await paymentService.initiate({
        amount: parseFloat(amount),
        phone_number: phoneNumber,
        payment_method: paymentMethod,
        description: description,
        rental_agreement_id: rentalAgreement?.id
      });

      setSuccess(response.data);
      
      if (onSuccess) {
        onSuccess(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Payment initiation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePayment = async () => {
    // For simulation mode - simulate completing the payment
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing
      setSuccess({
        message: 'Payment completed successfully! (SIMULATION MODE)',
        payment_id: Date.now()
      });
      if (onSuccess) {
        onSuccess({ payment_id: Date.now() });
      }
    } catch (err) {
      setError('Simulation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="success-container">
            <h2>✅ Payment Initiated</h2>
            <p>{success.message}</p>
            
            {success.checkout_request_id && (
              <p className="text-muted">
                Checkout ID: {success.checkout_request_id}
              </p>
            )}
            
            {success.paybill_number && (
              <div className="paybill-info">
                <h3>Paybill Details</h3>
                <p><strong>Paybill Number:</strong> {success.paybill_number}</p>
                <p><strong>Account Number:</strong> {success.account_number}</p>
              </div>
            )}
            
            <div className="modal-actions">
              <button onClick={handleSimulatePayment} className="btn btn-primary" disabled={loading}>
                {loading ? 'Processing...' : 'Simulate Completion (Test Only)'}
              </button>
              <button onClick={onClose} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>💳 Make Payment</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>Payment Method</label>
            <select 
              value={paymentMethod} 
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="form-control"
            >
              <option value="mpesa_stk_push">M-Pesa STK Push (Lipa na M-Pesa)</option>
              <option value="mpesa_paybill">M-Pesa Paybill</option>
            </select>
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="254XXXXXXXXX"
              required
              className="form-control"
            />
            <small className="text-muted">Enter phone number (e.g., 254712345678)</small>
          </div>

          <div className="form-group">
            <label>Amount (KES)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              required
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-control"
            />
          </div>

          <div className="modal-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Initiating...' : 'Pay Now'}
            </button>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>

        <div className="payment-info">
          <p className="text-muted">
            <small>
              💡 For STK Push, you will receive a prompt on your phone to complete the payment.
              <br />
              For Paybill, use the paybill number and account number shown after submitting.
            </small>
          </p>
        </div>
      </div>
    </div>
  );
}

export default PaymentModal;

