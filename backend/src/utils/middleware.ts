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
        const status =
            typeof set.status === "number"
                ? set.status
                : 500;

        return {
            status: "error",
            message:
                error instanceof Error
                    ? error.message
                    : "Unknown error",
            userFriendlyMessage: getUserFriendlyMessage(status)
        };
    });

function getUserFriendlyMessage(status: number) {
    // unchanged
}