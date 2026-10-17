import api from './api';

export const paymentService = {
  createOrder: async (bookingId) => {
    return await api.post('/payments/create-order', { bookingId });
  },

  verifyPayment: async (verificationData) => {
    return await api.post('/payments/verify', verificationData);
  },
};
