import multer from 'multer';
import { AppError } from '../utils/AppError.js';

// In-memory upload with size + MIME enforcement. Magic-byte check happens in the
// controller (it needs the buffer).
const storage = multer.memoryStorage();

export const uploadPdf = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter(req, file, cb) {
    if (file.mimetype !== 'application/pdf') {
      return cb(new AppError('Only PDF files are allowed', 400, 'INVALID_MIME'));
    }
    cb(null, true);
  },
}).single('policy');

// %PDF magic bytes.
export const assertPdfMagicBytes = (buffer) => {
  if (!buffer || buffer.length < 5 || buffer.subarray(0, 5).toString('latin1') !== '%PDF-') {
    throw new AppError('File is not a valid PDF (magic-byte check failed)', 400, 'INVALID_PDF');
  }
}
