const mongoose = require('mongoose');

const screenSchema = new mongoose.Schema(
  {
    theatreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Theatre',
      required: [true, 'Theatre ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Screen name is required'],
      trim: true,
      default: 'Screen 1',
    },
    seatCategories: {
      balcony: {
        count: { type: Number, default: 30, min: 0 },
        price: { type: Number, default: 250, min: 0 },
      },
      middle: {
        count: { type: Number, default: 50, min: 0 },
        price: { type: Number, default: 180, min: 0 },
      },
      lower: {
        count: { type: Number, default: 40, min: 0 },
        price: { type: Number, default: 120, min: 0 },
      },
    },
    totalSeats: {
      type: Number,
      required: true,
      default: 120,
    },
    seatLayout: [
      {
        seatNumber: { type: String, required: true },
        row: { type: String, required: true },
        number: { type: Number, required: true },
        category: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Cinema auditorium layout generator matching Cinepolis reference (IMAGE 2)
const generateCinepolisLayout = () => {
  const layout = [];
  // 1. RECLINER (Row L: 11 seats, 11 to 1)
  for (let s = 11; s >= 1; s--) {
    layout.push({ seatNumber: `L-${s}`, row: 'L', number: s, category: 'Recliner' });
  }
  // 2. PREMIUM PLUS (Row K: 15 seats, 15 to 1)
  for (let s = 15; s >= 1; s--) {
    layout.push({ seatNumber: `K-${s}`, row: 'K', number: s, category: 'Premium Plus' });
  }
  // 3. PREMIUM XL (Row J: 13 seats, 13 to 1)
  for (let s = 13; s >= 1; s--) {
    layout.push({ seatNumber: `J-${s}`, row: 'J', number: s, category: 'Premium XL' });
  }
  // 4. PREMIUM (Rows I, H, G, F, E: 17 seats each, 19 to 3)
  const premiumRows = ['I', 'H', 'G', 'F', 'E'];
  premiumRows.forEach((row) => {
    for (let s = 19; s >= 3; s--) {
      layout.push({ seatNumber: `${row}-${s}`, row, number: s, category: 'Premium' });
    }
  });
  // 5. EXECUTIVE (Rows D, C, B: 15 seats each, 15 to 1)
  const executiveRows = ['D', 'C', 'B'];
  executiveRows.forEach((row) => {
    for (let s = 15; s >= 1; s--) {
      layout.push({ seatNumber: `${row}-${s}`, row, number: s, category: 'Executive' });
    }
  });
  // 6. NORMAL (Row A: 15 seats, 15 to 1)
  for (let s = 15; s >= 1; s--) {
    layout.push({ seatNumber: `A-${s}`, row: 'A', number: s, category: 'Normal' });
  }
  return layout;
};

// Pre-save hook to calculate totalSeats and generate seatLayout if not provided
screenSchema.pre('save', function (next) {
  if (!this.seatLayout || this.seatLayout.length === 0) {
    this.seatLayout = generateCinepolisLayout();
  }
  this.totalSeats = this.seatLayout.length;
  next();
});

const Screen = mongoose.model('Screen', screenSchema);
Screen.generateCinepolisLayout = generateCinepolisLayout;
module.exports = Screen;

