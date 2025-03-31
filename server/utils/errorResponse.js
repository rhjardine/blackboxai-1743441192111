class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  // Static method to create common error responses
  static badRequest(msg = 'Bad Request') {
    return new ErrorResponse(msg, 400);
  }

  static unauthorized(msg = 'Unauthorized') {
    return new ErrorResponse(msg, 401);
  }

  static forbidden(msg = 'Forbidden') {
    return new ErrorResponse(msg, 403);
  }

  static notFound(msg = 'Resource Not Found') {
    return new ErrorResponse(msg, 404);
  }

  static conflict(msg = 'Conflict') {
    return new ErrorResponse(msg, 409);
  }

  static serverError(msg = 'Internal Server Error') {
    return new ErrorResponse(msg, 500);
  }

  // Method to send formatted error response
  send(res) {
    res.status(this.statusCode).json({
      success: false,
      error: this.message,
      stack: process.env.NODE_ENV === 'development' ? this.stack : undefined
    });
  }
}

module.exports = ErrorResponse;