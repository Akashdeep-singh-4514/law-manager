import { env } from "../../config/env";
import { UsersRepository } from "../../modules/users/users.repository";
import { UserRoles } from "../../modules/users/users.schema";
import { HTTPCodes, MyError } from "../../utils/errorHandling";
import type { AccessTokenPayload } from "../../utils/jwt";

const usersRepository = new UsersRepository();

export function isRoleRequest(request: Request): boolean {
    const url = new URL(request.url);

    return url.pathname.includes("/role");
}

export function ensureCanManageRoles(
    user: AccessTokenPayload,
): void {
    if (user.role === UserRoles.USER) {
        throw new MyError(
            "you do not have permission to change roles",
            HTTPCodes.FORBIDDEN,
        );
    }
}

export async function ensureCanModifyTargetUser(
    user: AccessTokenPayload,
    targetUserId: number,
): Promise<void> {
    const targetUser = await usersRepository.findById(targetUserId);

    if (!targetUser) {
        throw new MyError(
            "user not found",
            HTTPCodes.NOT_FOUND,
        );
    }

    if (
        targetUser.email === env.adminConf.email &&
        targetUser.email !== user.email
    ) {
        throw new MyError(
            "you do not have permission to modify this user",
            HTTPCodes.FORBIDDEN,
        );
    }
}

// NOTE: assumes UserRoles has an ADMIN member. If you have more than one
// elevated tier (e.g. ADMIN + SUPERADMIN), swap this for a rank/allowlist
// check instead of a single equality check.
export function ensureIsAdmin(
    user: AccessTokenPayload,
): void {
    if (user.role !== UserRoles.ADMIN) {
        throw new MyError(
            "admin privileges are required to access this resource",
            HTTPCodes.FORBIDDEN,
        );
    }
}
