export class HttpError extends Error {
    constructor(public status: number, message: string) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
export class ConflictError extends HttpError {
    constructor(message = 'Conflict') {
        super(409, message);
    }
}
