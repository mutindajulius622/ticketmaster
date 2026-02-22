import { useState, useEffect } from 'react';
import { paymentService, rentalService } from '../services/api';
import PaymentModal from '../components/PaymentModal';

function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [rentalAgreements, setRentalAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedAgreement, setSelectedAgreement] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [paymentsRes, rentalsRes] = await Promise.all([
        paymentService.getAll(),
        rentalService.getAll()
      ]);
      setPayments(paymentsRes.data);
      setRentalAgreements(rentalsRes.data);
    } catch {
      // Silently handle error - page will show empty state
    } finally {
      setLoading(false);
    }
  };

  const handleMakePayment = (agreement) => {
    setSelectedAgreement(agreement);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setSelectedAgreement(null);
    loadData();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'status-completed';
      case 'pending': return 'status-pending';
      case 'failed': return 'status-failed';
      case 'cancelled': return 'status-cancelled';
      default: return '';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const activeAgreements = rentalAgreements.filter(a => a.verified && a.status === 'active');

  return (
    <div className="payments-page">
      <div className="container">
      <div className="page-header">
        <h1>💳 Payments</h1>
        <p>Manage your rent payments and view payment history</p>
      </div>

      {showPaymentModal && (
        <PaymentModal 
          rentalAgreement={selectedAgreement}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Quick Payment Section */}
      {activeAgreements.length > 0 && (
        <div className="card">
          <h2>Quick Payment</h2>
          <div className="agreements-grid">
            {activeAgreements.map(agreement => (
              <div key={agreement.id} className="agreement-card">
                <h3>{agreement.property?.name || `Agreement #${agreement.id}`}</h3>
                <p className="rent-amount">KES {agreement.rent_amount.toLocaleString()}/month</p>
                <p className="lease-info">
                  {new Date(agreement.lease_start_date).toLocaleDateString()} - 
                  {agreement.lease_end_date ? new Date(agreement.lease_end_date).toLocaleDateString() : 'Ongoing'}
                </p>
                <button 
                  className="btn btn-primary"
                  onClick={() => handleMakePayment(agreement)}
                >
                  Make Payment
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment History */}
      <div className="card">
        <h2>Payment History</h2>
        
        {loading ? (
          <div className="loading">Loading payments...</div>
        ) : payments.length === 0 ? (
          <div className="empty-state">
            <p>No payments found.</p>
            <p>Make a payment using the Quick Payment section above.</p>
          </div>
        ) : (
          <table className="payments-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Receipt</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => (
                <tr key={payment.id}>
                  <td>#{payment.id}</td>
                  <td>{formatDate(payment.created_at)}</td>
                  <td>KES {payment.amount.toLocaleString()}</td>
                  <td>
                    {payment.payment_method === 'mpesa_stk_push' ? 'STK Push' : 'Paybill'}
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td>{payment.mpesa_receipt_number || '-'}</td>
                  <td>{payment.transaction_desc || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      </div>
    </div>
  );
}

export default PaymentsPage;

