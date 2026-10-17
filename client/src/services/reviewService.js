import api from './api';

export const reviewService = {
  getReviews: async (movieId) => {
    return await api.get(`/movies/${movieId}/reviews`);
  },

  submitReview: async (movieId, reviewData) => {
    return await api.post(`/movies/${movieId}/reviews`, reviewData);
  },

  deleteReview: async (reviewId) => {
    return await api.delete(`/reviews/${reviewId}`);
  },
};
