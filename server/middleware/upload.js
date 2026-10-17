const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '../public/uploads/posters');

// Ensure directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path
      .basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 30);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `poster-${cleanBase || 'img'}-${uniqueSuffix}${ext || '.jpg'}`);
  },
});

// File filter (images only)
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/avif',
    'image/gif',
  ];

  const allowedExts = /\.(jpg|jpeg|png|webp|avif|gif)$/i;

  if (
    allowedMimeTypes.includes(file.mimetype) ||
    allowedExts.test(path.extname(file.originalname))
  ) {
    cb(null, true);
  } else {
    cb(new Error('Invalid image file format. Only JPG, PNG, WEBP, and GIF are supported.'), false);
  }
};

const uploadPoster = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max limit
  },
  fileFilter,
});

module.exports = {
  uploadPoster,
};
