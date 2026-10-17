import api from './api';

export const adminService = {
  getDashboard: async () => {
    return await api.get('/admin/dashboard');
  },

  getAllBookings: async (params = {}) => {
    return await api.get('/admin/bookings', { params });
  },

  getAllUsers: async (params = {}) => {
    return await api.get('/admin/users', { params });
  },

  toggleUserStatus: async (userId, isActive) => {
    return await api.patch(`/admin/users/${userId}/status`, { isActive });
  },

  getRevenueReport: async (params = {}) => {
    return await api.get('/admin/revenue', { params });
  },

  moderateReview: async (reviewId, status) => {
    return await api.patch(`/admin/reviews/${reviewId}/status`, { status });
  },
};
