import { Elysia } from "elysia";
import { HTTPCodes, MyError } from "../utils/errorHandling";
import { verifyAccessToken, type AccessTokenPayload } from "../utils/jwt";

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

    if (err.summary?.includes("found: undefined")) {
        return `${field} is required`;
    }

    if (schema.format === "email") {
        return `${field} must be a valid email address`;
    }

    if (typeof schema.pattern === "string") {
        return `${field} format is invalid`;
    }

    if (typeof schema.maxLength === "number" && typeof schema.minLength === "number") {
        return `${field} must be ${schema.minLength}-${schema.maxLength} characters long`;
    }

    if (typeof schema.maxLength === "number") {
        return `${field} must be at most ${schema.maxLength} characters long`;
    }

    if (typeof schema.minLength === "number") {
        return `${field} must be at least ${schema.minLength} characters long`;
    }


    return err.message || `${field} is invalid`;
}


function extractBearerToken(authHeader: string | undefined): string {
    if (!authHeader) {
        throw new MyError("missing authorization header", HTTPCodes.UNAUTHORIZED);
    }

    const [scheme, token] = authHeader.split(" ");
    if (scheme !== "Bearer" || !token) {
        throw new MyError(
            "authorization header must be in the form 'Bearer <token>'",
            HTTPCodes.UNAUTHORIZED,
        );
    }

    return token;
}

export const authMiddleware = new Elysia({ name: "auth-middleware" }).derive(
    { as: "scoped" },
    ({ headers }): { user: AccessTokenPayload } => {
        const token = extractBearerToken(headers.authorization);

        try {
          const user = verifyAccessToken(token);

            return { user };
        } catch {
            throw new MyError("invalid or expired access token", HTTPCodes.UNAUTHORIZED);
        }
    },
);


export const requireSelfMiddleware = new Elysia({ name: "require-self-middleware" })
    .use(authMiddleware)
    .onBeforeHandle({ as: "scoped" }, ({ params, user }) => {
        const rawId = (params as Record<string, string | undefined>).id;
        const paramId = Number(rawId);

        if (rawId === undefined || Number.isNaN(paramId)) {
            throw new Error("requireSelfMiddleware used on a route with no numeric :id param");
        }

        if (paramId !== user?.userId) {
            throw new MyError(
                "you are not allowed to access this resource",
                HTTPCodes.FORBIDDEN,
            );
        }
    });
