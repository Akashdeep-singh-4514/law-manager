import { Elysia } from 'elysia'

export class MyError extends Error {
	status = 418

	constructor(public override message: string) {
		super(message)
	}

	toResponse(code?: Number) {
		return Response.json({
			error: this.message,
			code: code??this.status
		}, {
			status: 418
		})
	}
}

export enum ErrorCodes {
    CONFLICT=409,
}