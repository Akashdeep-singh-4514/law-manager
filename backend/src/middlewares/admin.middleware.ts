import { Elysia } from "elysia";

import type { AccessTokenPayload } from "../utils/jwt";
import { authenticate } from "./utils/auth.util";
import { ensureIsAdmin } from "./utils/permissions.util";


export const adminMiddleware = new Elysia({
    name: "admin-middleware",
}).derive(
    { as: "scoped" },
    ({
        headers,
    }): {
        user: AccessTokenPayload;
    } => {
        const user = authenticate(headers.authorization);

        ensureIsAdmin(user);

        return {
            user,
        };
    },
);

export const requireAdmin = ({
    user,
}: {
    user: AccessTokenPayload;
}) => {
    ensureIsAdmin(user);
};
