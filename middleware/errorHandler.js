export default function(err, req, res, next) {
    if (err instanceof ApiError) {
      return res.status(err.status).json({
        error: err.message,
        status: err.status
      });
    }
    
    console.error('Unhandled error:', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      status: 500
    });
  }
  
  class ApiError extends Error {
    constructor(status, message) {
      super();
      this.status = status;
      this.message = message;
    }
  
    static badRequest(message) {
      return new ApiError(400, message);
    }
  
    static unauthorized(message) {
      return new ApiError(401, message);
    }
  
    static notFound(message) {
      return new ApiError(404, message);
    }
  
    static internal(message = 'Internal Server Error') {
      return new ApiError(500, message);
    }
  }
  
  export { ApiError };