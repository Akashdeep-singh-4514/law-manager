import { Elysia } from "elysia";

import type { AccessTokenPayload } from "../utils/jwt";
import { authenticate } from "./utils/auth.util";

export const authMiddleware = new Elysia({
    name: "auth-middleware",
})
    .derive(
        { as: "scoped" },
        ({ headers }): {
            user: AccessTokenPayload;
        } => {
            const user = authenticate(
                headers.authorization,
            );

            return {
                user,
            };
        },
    );
