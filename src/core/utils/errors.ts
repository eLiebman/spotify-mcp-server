export enum SpotifyErrorCode {
  AuthenticationError = 'AUTHENTICATION_ERROR',
  RateLimitError = 'RATE_LIMIT_ERROR',
  NotFoundError = 'NOT_FOUND_ERROR',
  BadRequestError = 'BAD_REQUEST_ERROR',
  InternalError = 'INTERNAL_ERROR',
  NetworkError = 'NETWORK_ERROR'
}

export class SpotifyError extends Error {
  constructor(
    public code: SpotifyErrorCode,
    message: string,
    public statusCode?: number,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'SpotifyError';
  }

  static fromHttpStatus(status: number, message: string): SpotifyError {
    switch (status) {
      case 401:
        return new SpotifyError(SpotifyErrorCode.AuthenticationError, message, status);
      case 403:
        return new SpotifyError(SpotifyErrorCode.AuthenticationError, message, status);
      case 404:
        return new SpotifyError(SpotifyErrorCode.NotFoundError, message, status);
      case 400:
        return new SpotifyError(SpotifyErrorCode.BadRequestError, message, status);
      case 429:
        return new SpotifyError(SpotifyErrorCode.RateLimitError, message, status);
      default:
        return new SpotifyError(SpotifyErrorCode.InternalError, message, status);
    }
  }
}
