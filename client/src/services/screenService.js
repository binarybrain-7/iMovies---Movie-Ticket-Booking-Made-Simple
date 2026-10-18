import api from './api';

export const screenService = {
  getScreens: async (params = {}) => {
    return await api.get('/screens', { params });
  },

  getScreenById: async (screenId) => {
    return await api.get(`/screens/${screenId}`);
  },

  getScreensByTheatre: async (theatreId, params = {}) => {
    return await api.get(`/theatres/${theatreId}/screens`, { params });
  },

  createScreen: async (theatreId, screenData) => {
    if (theatreId) {
      return await api.post(`/theatres/${theatreId}/screens`, screenData);
    }
    return await api.post('/screens', screenData);
  },

  updateScreen: async (screenId, screenData) => {
    return await api.put(`/screens/${screenId}`, screenData);
  },

  deleteScreen: async (screenId) => {
    return await api.delete(`/screens/${screenId}`);
  },
};

export default screenService;
