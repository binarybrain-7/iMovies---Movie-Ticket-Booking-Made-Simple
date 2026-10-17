import api from './api';

export const showService = {
  getShows: async (params = {}) => {
    return await api.get('/shows', { params });
  },

  getShowById: async (showId) => {
    return await api.get(`/shows/${showId}`);
  },

  getShowSeats: async (showId) => {
    return await api.get(`/shows/${showId}/seats`);
  },

  createShow: async (showData) => {
    return await api.post('/shows', showData);
  },

  deleteShow: async (showId) => {
    return await api.delete(`/shows/${showId}`);
  },
};
