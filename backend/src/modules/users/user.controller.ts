import { Elysia, t } from "elysia";
import { type CreateUser } from "./users.schema";
import { UsersService } from "./users.service";
import { logError } from "../../utils/logger";
import { usersValidator } from "./user.validate";

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
                        set.status = 304
                    }
                    return res
                } catch (e) {
                    logError(e, "getting users")
                    throw e;
                }
            },
                {
                    body: usersValidator
                },)
    }
}