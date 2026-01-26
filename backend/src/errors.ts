export class HttpError extends Error {
  public status: number;
  constructor(status: number, message?: string) {
    super(message ?? 'Error');
    this.status = status;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class NotFoundError extends HttpError {
  constructor(message = 'Not Found') {
    super(404, message);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = 'Forbidden') {
    super(403, message);
  }
}

export class BadRequestError extends HttpError {
  constructor(message = 'Bad Request') {
    super(400, message);
  }
}

export class ConflictError extends HttpError {
  constructor(message = 'Conflict') {
    super(409, message);
  }
}
