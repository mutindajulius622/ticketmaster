import api from './api';

const ticketService = {
  getUserTickets: (params) =>
    api.get('/tickets', { params }),
  
  getTicket: (ticketId) =>
    api.get(`/tickets/${ticketId}`),
  
  purchaseTicket: (ticketData) =>
    api.post('/tickets', ticketData),
  
  cancelTicket: (ticketId) =>
    api.post(`/tickets/${ticketId}/cancel`),
  
  downloadTicket: (ticketId) =>
    api.get(`/tickets/${ticketId}/download`),
  
  validateTicket: (ticketId) =>
    api.post(`/tickets/${ticketId}/validate`),
};

export default ticketService;
