import api from './api';

export const movieService = {
  getMovies: async (params = {}) => {
    return await api.get('/movies', { params });
  },

  getMovieById: async (movieId) => {
    return await api.get(`/movies/${movieId}`);
  },

  createMovie: async (movieData) => {
    return await api.post('/movies', movieData);
  },

  updateMovie: async (movieId, movieData) => {
    return await api.patch(`/movies/${movieId}`, movieData);
  },

  deleteMovie: async (movieId) => {
    return await api.delete(`/movies/${movieId}`);
  },

  uploadPoster: async (file) => {
    const formData = new FormData();
    formData.append('poster', file);
    return await api.post('/movies/upload-poster', formData);
  },
};

