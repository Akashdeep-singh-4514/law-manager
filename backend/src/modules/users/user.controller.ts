import { Elysia, t } from "elysia";
import { type CreateUser, type UpdatePassword, type UpdateUser } from "./users.schema";
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
            }, {
                params:idValidator
            })
            .post("/", async ({ body }) => {
                try {
                    const res = await this.usersService.postUser(body as CreateUser);

                    return res
                } catch (e) {
                    logError(e, "creating user")
                    throw e;
                }
            },
                {
                    body: usersPostValidator
                },)
            .patch("/:id", async ({ body, params }) => {
                try {
                    if (!params.id) {
                        throw new MyError("id is required",HTTPCodes.BAD_REQUEST)
                    }
                    const res = await this.usersService.patchUser(params.id,body as UpdateUser);

                    return res
                } catch (e) {
                    logError(e, "updating user")
                    throw e;
                }
            }, {
                body: usersUpdateValidator,
                params: idValidator
            })
            .patch("/:id/password", async ({body,params})=>{
                try {
                    if (!params.id) {
                        throw new MyError("id is required",HTTPCodes.BAD_REQUEST)
                    }
                    const res = await this.usersService.updatePassword(Number(params.id),body as UpdatePassword);

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
            }).delete("/:id", async ({params})=>{
                try {
                    if (!params.id) {
                        throw new MyError("id is required",HTTPCodes.BAD_REQUEST)
                    }
                    const res = await this.usersService.deleteUser(Number(params.id));

                    return res
                } catch (e) {
                    logError(e, "deleting user")
                    throw e;
                }
            },{
                params:idValidator
            })

    }
}
