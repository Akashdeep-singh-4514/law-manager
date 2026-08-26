import { Elysia } from "elysia";

import { authenticate } from "./utils/auth.util";
import { getUserIdFromParams } from "./utils/params.util";
import {
    ensureCanManageRoles,
    ensureCanModifyTargetUser,
    isRoleRequest,
} from "./utils/permissions.util";

export const roleManagementMiddleware = new Elysia({
    name: "role-management-middleware",
})
    .derive(
        { as: "scoped" },
        async ({ headers, params, request }) => {
            const user = authenticate(
                headers.authorization,
            );

            if (!isRoleRequest(request)) {
                return {
                    user,
                };
            }

            ensureCanManageRoles(user);

            const targetUserId =
                getUserIdFromParams(params);

            await ensureCanModifyTargetUser(
                user,
                targetUserId,
            );

            return {
                user,
            };
        },
    );
