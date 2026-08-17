import { Elysia } from "elysia";

export const responseMiddleware = new Elysia()
    .onAfterHandle({ as: "global" }, ({ response }) => {
        return {
            status: "success",
            data: response,
            message: "Request successful",
            userFriendlyMessage: "Request completed successfully."
        };
    })

    .onError({ as: "global" }, ({ error, set }) => {
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
