import { Elysia, status } from "elysia";

export const responseMiddleware = new Elysia()
    .onAfterHandle({ as: "global" }, ({ response }) => {
        return {
            statusCode:200,
            status: "success",
            data: response,
            message: "Request successful",
        };
    })

    .onError({ as: "global" }, ({ error, code, set }) => {
        if (code === "VALIDATION") {
            set.status = 422;
            const validationError = error as unknown as {
                all: Array<{
                    path: string;
                    message: string;
                    summary?: string;
                    schema?: Record<string, unknown>;
                }>;
            };

            const errors = (validationError.all ?? []).map((err) => {
                const field = err.path?.replace(/^\//, "") || "body";
                return {
                    field,
                    message: humanizeValidationMessage(field, err),
                };
            });

            return {
                statuscode: 422,
                status: "error",
                message: "Validation failed",
                errors,
            };
        }

        const statuscode =
            typeof set.status === "number"
                ? set.status
                : 500;

        return {
            statuscode,
            status: "error",
            message:
                error instanceof Error
                    ? error.message
                    : "Unknown error",
        };
    });

function humanizeValidationMessage(
    field: string,
    err: { message: string; summary?: string; schema?: Record<string, unknown> }
): string {
    const schema = err.schema ?? {};

    // Missing field entirely (TypeBox reports this as "found: undefined")
    if (err.summary?.includes("found: undefined")) {
        return `${field} is required`;
    }

    if (schema.format === "email") {
        return `${field} must be a valid email address`;
    }

    if (typeof schema.pattern === "string") {
        return `${field} format is invalid`;
    }

    if (typeof schema.minLength === "number") {
        return `${field} must be at least ${schema.minLength} characters long`;
    }

    if (typeof schema.maxLength === "number") {
        return `${field} must be at most ${schema.maxLength} characters long`;
    }

    return err.message || `${field} is invalid`;
}