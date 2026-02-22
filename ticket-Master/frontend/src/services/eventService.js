import api from './api';

const eventService = {
  getEvents: (params) =>
    api.get('/events', { params }),
  
  getEvent: (eventId) =>
    api.get(`/events/${eventId}`),
  
  createEvent: (eventData) =>
    api.post('/events', eventData),
  
  updateEvent: (eventId, eventData) =>
    api.put(`/events/${eventId}`, eventData),
  
  deleteEvent: (eventId) =>
    api.delete(`/events/${eventId}`),
  
  createTicketType: (eventId, ticketTypeData) =>
    api.post(`/events/${eventId}/ticket-types`, ticketTypeData),
  
  getEventReviews: (eventId) =>
    api.get(`/events/${eventId}/reviews`),
  
  createReview: (eventId, reviewData) =>
    api.post(`/events/${eventId}/reviews`, reviewData),
  
  saveEvent: (eventId) =>
    api.post(`/events/${eventId}/save`),
  
  unsaveEvent: (eventId) =>
    api.delete(`/events/${eventId}/save`),
};

export default eventService;
