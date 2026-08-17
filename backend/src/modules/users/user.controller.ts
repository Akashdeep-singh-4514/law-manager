import { Elysia, t } from "elysia";
import { type CreateUser, type updatePassword, type updateUser } from "./users.schema";
import { UsersService } from "./users.service";
import { logError } from "../../utils/logger";
import { usersPostValidator, usersUpdateValidator } from "./user.validate";
import { HTTPCodes, MyError } from "../../utils/errorHandling";
import { idValidator, passwordValidator } from "../../utils/validator";

export class UsersController {
    private readonly usersService: UsersService;

    constructor() {
        this.usersService = new UsersService();
    }

    getRoutes() {
        return new Elysia({
            prefix: "/users",
        })
            .get("/", async () => {
                try {
                    return await this.usersService.getUsers();
                } catch (e) {
                    logError(e, "getting users")
                    throw e;
                }
            })
            .get("/:id", async ({ params }) => {
                try {
                    if (!params.id) {
                        throw new MyError("id is required",HTTPCodes.BAD_REQUEST)
                    }
                    return await this.usersService.getUserById(Number(params.id));
                } catch (e) {
                    logError(e, "getting user by id")
                    throw e;
                }
            })
            .post("/", async ({ body, set }) => {
                try {
                    const res = await this.usersService.postUser(body as CreateUser);
                    if (!res) {
                        set.status = HTTPCodes.NOT_MODIFIED
                    }
                    return res
                } catch (e) {
                    logError(e, "creating user")
                    throw e;
                }
            },
                {
                    body: usersPostValidator
                },)
            .patch("/:id", async ({ body, set, params }) => {
                try {
                    if (!params.id) {
                        throw new MyError("id is required",HTTPCodes.BAD_REQUEST)
                    }
                    const res = await this.usersService.patchUser(params.id,body as updateUser);
                    if (!res) {
                        set.status = HTTPCodes.NOT_MODIFIED
                    }
                    return res
                } catch (e) {
                    logError(e, "updating user")
                    throw e;
                }
            }, {
                body: usersUpdateValidator,
                params: idValidator
            })
            .patch("/:id/password", async ({body,set,params})=>{
                try {
                    if (!params.id) {
                        throw new MyError("id is required",HTTPCodes.BAD_REQUEST)
                    }
                    const res = await this.usersService.updatePassword(Number(params.id),body as updatePassword);
                    if (!res) {
                        set.status = HTTPCodes.NOT_MODIFIED
                    }
                    return res
                } catch (e) {
                    logError(e, "updating user password")
                    throw e;
                }
            },{
                body:t.Object({
                    password:passwordValidator()
                }),
                params:idValidator
            })
    }
}