const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    movieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: [true, 'Movie ID is required'],
      index: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: ['APPROVED', 'FLAGGED', 'REMOVED'],
      default: 'APPROVED',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// One review per user per movie
reviewSchema.index({ userId: 1, movieId: 1 }, { unique: true });

// Static helper to recalculate movie rating
reviewSchema.statics.calculateMovieRating = async function (movieId) {
  const stats = await this.aggregate([
    {
      $match: {
        movieId: new mongoose.Types.ObjectId(movieId),
        status: 'APPROVED',
      },
    },
    {
      $group: {
        _id: '$movieId',
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  const Movie = mongoose.model('Movie');
  if (stats.length > 0) {
    await Movie.findByIdAndUpdate(movieId, {
      averageRating: Math.round(stats[0].averageRating * 10) / 10,
      reviewCount: stats[0].reviewCount,
    });
  } else {
    await Movie.findByIdAndUpdate(movieId, {
      averageRating: 0,
      reviewCount: 0,
    });
  }
};

reviewSchema.post('save', async function () {
  await this.constructor.calculateMovieRating(this.movieId);
});

reviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await doc.constructor.calculateMovieRating(doc.movieId);
  }
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
