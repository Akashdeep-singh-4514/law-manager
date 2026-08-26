import { Elysia } from "elysia";

import { HTTPCodes } from "../utils/errorHandling";
import {
    humanizeValidationMessage,
    type ValidationError,
} from "./utils/validation.util";

export const responseMiddleware = new Elysia({
    name: "response-middleware",
})
    .onAfterHandle(
        { as: "global" },
        ({ response }) => {
            return {
                statusCode: 200,
                status: "success",
                data: response,
                message: "Request successful",
            };
        },
    )
    .onError(
        { as: "global" },
        ({ error, code, set }) => {

            if (code === "VALIDATION") {
                const validationError =
                    error as unknown as ValidationError;

                const errors = (
                    validationError.all ?? []
                ).map((validationIssue) => {
                    const field =
                        validationIssue.path?.replace(
                            /^\//,
                            "",
                        ) || "body";

                    return {
                        field,
                        message: humanizeValidationMessage(
                            field,
                            validationIssue,
                        ),
                    };
                });

                set.status = HTTPCodes.UNPROCESSABLE_ENTITY;

                return {
                    statusCode:
                        HTTPCodes.UNPROCESSABLE_ENTITY,
                    status: "error",
                    message: "Validation failed",
                    errors,
                };
            }

            const statusCode =
                typeof set.status === "number"
                    ? set.status
                    : HTTPCodes.INTERNAL_SERVER_ERROR;

            return {
                statusCode,
                status: "error",
                message:
                    error instanceof Error
                        ? error.message
                        : "Internal server error",
            };
        },
    );
