const mongoose = require('mongoose');

const seatLockSchema = new mongoose.Schema(
  {
    showId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Show',
      required: [true, 'Show ID is required'],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    seats: [
      {
        seatNumber: { type: String, required: true },
        category: {
          type: String,
          enum: [
            'Recliner',
            'Premium Plus',
            'Premium XL',
            'Premium',
            'Executive',
            'Normal',
            'Balcony',
            'Middle',
            'Lower',
          ],
          required: true,
        },
        price: { type: Number, required: true },
      },
    ],
    lockToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'RELEASED', 'CONFIRMED'],
      default: 'ACTIVE',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index for automatic document cleanup after expiration
seatLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// Query index for checking seat availability
seatLockSchema.index({ showId: 1, status: 1, expiresAt: 1 });

const SeatLock = mongoose.model('SeatLock', seatLockSchema);
module.exports = SeatLock;
