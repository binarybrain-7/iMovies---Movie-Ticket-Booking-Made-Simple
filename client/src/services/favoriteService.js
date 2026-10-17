import api from './api';

export const favoriteService = {
  getFavorites: async () => {
    return await api.get('/favorites');
  },

  addFavorite: async (movieId) => {
    return await api.post(`/favorites/${movieId}`);
  },

  removeFavorite: async (movieId) => {
    return await api.delete(`/favorites/${movieId}`);
  },
};
