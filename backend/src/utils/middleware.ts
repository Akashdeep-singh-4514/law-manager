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
            status: "error",
            message:
                error instanceof Error
                    ? error.message
                    : "Unknown error",
            userFriendlyMessage: getUserFriendlyMessage(statuscode)
        };
    });

function getUserFriendlyMessage(status: number): string {
    const messages: Record<number, string> = {
        // 400s — client errors
        400: "Something about your request wasn't quite right. Please check and try again.",
        401: "You need to sign in to do that.",
        402: "Payment is required to continue.",
        403: "You don't have permission to do that.",
        404: "We couldn't find what you were looking for.",
        405: "That action isn't allowed here.",
        408: "The request took too long. Please try again.",
        409: "This conflicts with something that already exists.",
        410: "This is no longer available.",
        413: "That file or request is too large.",
        415: "That file type isn't supported.",
        422: "Some of the information you provided isn't valid.",
        429: "You're doing that too much. Please slow down and try again shortly.",

        // 500s — server errors
        500: "Something went wrong on our end. Please try again.",
        501: "This feature isn't available yet.",
        502: "We're having trouble connecting to a service. Please try again shortly.",
        503: "The service is temporarily unavailable. Please try again in a moment.",
        504: "The request timed out. Please try again.",
    };

    if (messages[status]) {
        return messages[status];
    }

    // Fallback by status range for anything not explicitly mapped
    if (status >= 400 && status < 500) {
        return "There was a problem with your request. Please check and try again.";
    }

    if (status >= 500) {
        return "Something went wrong on our end. Please try again later.";
    }

    return "Something unexpected happened. Please try again.";
}