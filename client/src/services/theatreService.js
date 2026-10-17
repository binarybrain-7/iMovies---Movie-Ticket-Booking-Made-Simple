import api from './api';

export const theatreService = {
  getTheatres: async (params = {}) => {
    return await api.get('/theatres', { params });
  },

  getTheatreById: async (theatreId) => {
    return await api.get(`/theatres/${theatreId}`);
  },

  createTheatre: async (theatreData) => {
    return await api.post('/theatres', theatreData);
  },

  updateTheatre: async (theatreId, theatreData) => {
    return await api.patch(`/theatres/${theatreId}`, theatreData);
  },

  deleteTheatre: async (theatreId) => {
    return await api.delete(`/theatres/${theatreId}`);
  },
};
