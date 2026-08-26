import { Elysia } from "elysia";

import { UserRoles } from "../modules/users/users.schema";
import { HTTPCodes, MyError } from "../utils/errorHandling";
import { authenticate } from "./utils/auth.util";
import { getUserIdFromParams } from "./utils/params.util";

export const requireSelfMiddleware = new Elysia({
    name: "require-self-middleware",
})
    .derive(
        { as: "scoped" },
        ({ headers, params }) => {
            const user = authenticate(
                headers.authorization,
            );

            const userId = getUserIdFromParams(params);

            if (userId !== user.userId && user.role === UserRoles.USER) {
                throw new MyError(
                    "you are not allowed to access this resource",
                    HTTPCodes.FORBIDDEN,
                );
            }

            return {
                user,
            };
        },
    );
