// Operational error. Controllers/services throw this; errorHandler renders it
// into the API error contract: { success:false, message, error:{ code, details } }.
export class AppError extends Error {
  constructor(message, status = 400, code = 'BAD_REQUEST', details = {}) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.isOperational = true;
  }
}
