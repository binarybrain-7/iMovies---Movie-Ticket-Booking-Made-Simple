const mongoose = require('mongoose');

const showSchema = new mongoose.Schema(
  {
    movieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: [true, 'Movie ID is required'],
      index: true,
    },
    theatreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Theatre',
      required: [true, 'Theatre ID is required'],
      index: true,
    },
    screenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Screen',
      required: [true, 'Screen ID is required'],
      index: true,
    },
    showDate: {
      type: String, // Stored as YYYY-MM-DD for reliable date comparison
      required: [true, 'Show date is required (YYYY-MM-DD)'],
      index: true,
    },
    startTime: {
      type: String, // e.g. "14:00" or "02:00 PM"
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: String,
      default: '',
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
    },
    seatPricing: {
      type: mongoose.Schema.Types.Mixed,
      default: {
        Recliner: 690,
        'Premium Plus': 230,
        'Premium XL': 230,
        Premium: 210,
        Executive: 210,
        Normal: 210,
        Balcony: 250,
        Middle: 180,
        Lower: 120,
      },
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'completed'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate shows on same screen at same date and start time
showSchema.index({ screenId: 1, showDate: 1, startTime: 1 }, { unique: true });

const Show = mongoose.model('Show', showSchema);
module.exports = Show;
