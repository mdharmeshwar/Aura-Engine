export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Unexpected server error.';

  const safeMessage = statusCode === 500 ? 'Internal server error.' : message;

  res.status(statusCode).json({
    success: false,
    message: safeMessage,
    ...(process.env.NODE_ENV !== 'production' && statusCode !== 500 && { stack: err.stack }),
  });
}
