export class MyError extends Error {
    status: number
    constructor(message: string, status: number = 418) {
        super(message)
        this.status = status
        this.name = "MyError"
    }
}

export enum ErrorCodes {
    // 4xx — client errors
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    CONFLICT = 409,
    UNPROCESSABLE_ENTITY = 422,
    TOO_MANY_REQUESTS = 429,

    // 5xx — server errors
    INTERNAL_SERVER_ERROR = 500,
    NOT_IMPLEMENTED = 501,
    SERVICE_UNAVAILABLE = 503,
}