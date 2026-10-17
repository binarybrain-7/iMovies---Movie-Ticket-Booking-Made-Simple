const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Movie title is required'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Movie description is required'],
      trim: true,
    },
    genres: {
      type: [String],
      required: [true, 'At least one genre is required'],
      index: true,
    },
    language: {
      type: String,
      default: 'English',
      trim: true,
      index: true,
    },
    runtimeMinutes: {
      type: Number,
      required: [true, 'Runtime in minutes is required'],
      min: [1, 'Runtime must be at least 1 minute'],
    },
    releaseDate: {
      type: Date,
      required: [true, 'Release date is required'],
      index: true,
    },
    certification: {
      type: String,
      trim: true,
      default: 'UA',
    },
    cast: {
      type: [String],
      default: [],
    },
    director: {
      type: String,
      default: '',
      trim: true,
    },
    posterUrl: {
      type: String,
      required: [true, 'Poster image URL is required'],
      trim: true,
    },
    backdropUrl: {
      type: String,
      default: '',
      trim: true,
    },
    trailerUrl: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['now_showing', 'upcoming', 'archived'],
      default: 'now_showing',
      index: true,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

movieSchema.index(
  { title: 'text', description: 'text', genres: 'text' },
  { language_override: 'none' }
);

const Movie = mongoose.model('Movie', movieSchema);
module.exports = Movie;
