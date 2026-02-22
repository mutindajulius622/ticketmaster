import api from './api';

const paymentService = {
  getUserPayments: (params) =>
    api.get('/payments', { params }),
  
  getPaymentStatus: (paymentId) =>
    api.get(`/payments/${paymentId}/status`),
  
  createPayPalOrder: (paymentId) =>
    api.post('/payments/paypal/create-order', {
      payment_id: paymentId,
    }),

  createPayment: (payload) =>
    api.post('/payments/create', payload),
  
  capturePayPalOrder: (orderId) =>
    api.post('/payments/paypal/capture-order', {
      order_id: orderId,
    }),
  
  refundPayment: (paymentId) =>
    api.post(`/payments/${paymentId}/refund`),
};

export default paymentService;
