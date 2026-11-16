export interface StandardApiError {
  statusCode: number;
  message: string;
  error?: string;
  details?: Record<string, any>;
  timestamp: string;
}

export const mapApiError = (error: any): StandardApiError => {
  const status = error?.status || error?.response?.status || 500;
  const data = error?.data || error?.response?.data || {};

  const baseError: StandardApiError = {
    statusCode: status,
    message: data?.message || 'An unexpected error occurred.',
    error: data?.error || 'Error',
    details: data?.details || data?.errors,
    timestamp: new Date().toISOString(),
  };

  switch (status) {
    case 400:
      baseError.message = data?.message || 'Invalid input data. Please check your request.';
      baseError.error = 'Bad Request';
      break;
    case 401:
      baseError.message = 'Your session has expired. Please sign in again.';
      baseError.error = 'Unauthorized';
      break;
    case 403:
      baseError.message = 'You do not have permission to perform this action.';
      baseError.error = 'Forbidden';
      break;
    case 404:
      baseError.message = data?.message || 'The requested resource was not found.';
      baseError.error = 'Not Found';
      break;
    case 409:
      baseError.message = data?.message || 'A record with this information already exists.';
      baseError.error = 'Conflict';
      break;
    case 422:
      baseError.message =
        data?.message || 'Business rule violation. Operation cannot be completed.';
      baseError.error = 'Unprocessable Entity';
      break;
    case 500:
    default:
      baseError.message =
        data?.message || 'Internal server error. Please try again or contact support.';
      baseError.error = 'Server Error';
      break;
  }

  return baseError;
};
