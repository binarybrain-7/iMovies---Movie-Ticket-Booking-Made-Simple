import api from './api';

export const bookingService = {
  createSeatLock: async (showId, seats) => {
    return await api.post(`/shows/${showId}/seat-locks`, { seats });
  },

  releaseSeatLock: async (lockId) => {
    return await api.delete(`/seat-locks/${lockId}`);
  },

  createBooking: async (showId, lockToken) => {
    return await api.post('/bookings', { showId, lockToken });
  },

  getMyBookings: async (filter = 'all') => {
    return await api.get('/bookings/me', { params: { filter } });
  },

  getBookingById: async (bookingId) => {
    return await api.get(`/bookings/${bookingId}`);
  },

  cancelBooking: async (bookingId, reason) => {
    return await api.post(`/bookings/${bookingId}/cancel`, { reason });
  },

  verifyTicket: async (bookingReference) => {
    return await api.get(`/tickets/${bookingReference}/verify`);
  },
};
