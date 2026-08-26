import Elysia, { t } from "elysia";
import { UsersService } from "./users.service";
import { UserRoles, type CreateUser } from "./users.schema";
import { logError } from "../../utils/logger";
import { usersPostValidator } from "./user.validate";

import { HTTPCodes, MyError } from "../../utils/errorHandling";
import { idValidator } from "../../utils/validator";
import { adminMiddleware, roleManagementMiddleware } from "../../middlewares";

export class AdminController {
    private readonly usersService: UsersService;

    constructor() {
        this.usersService = new UsersService();
    }
    getRoutes() {
        return new Elysia({
            prefix: "/users",
        })
            .use(adminMiddleware)
            .post("/create-admin", async ({ body }) => {
                try {
                    const res = await this.usersService.postUser(body as CreateUser, UserRoles.ADMIN);

                    return res;
                } catch (e) {
                    logError(e, "creating admin");
                    throw e;
                }
            },
                {
                    body: usersPostValidator,
                },)
            .use(roleManagementMiddleware)
            .patch("/:id/role", async ({ params, body }) => {
                try {
                    if (!params.id) {
                        throw new MyError("id is required", HTTPCodes.BAD_REQUEST);
                    }
                    const res = await this.usersService.changeRole(params.id, body);

                    return res;
                } catch (e) {
                    logError(e, "updating role");
                    throw e;
                }
            }, {
                body: t.Object({
                    role: t.Enum(UserRoles)
                }),
                params: idValidator,
            },)
    }
}