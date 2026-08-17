import { Elysia, t } from "elysia";
import { type CreateUser } from "./users.schema";
import { UsersService } from "./users.service";
import { logError } from "../../utils/logger";

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
                    body: t.Object({
                        name: t.String({
                            minLength: 1,
                            maxLength: 255,
                            error: "Name is required and must be under 255 characters",
                        }),
                        email: t.Transform(
                            t.String({
                                format: "email",
                                error: "Please enter a valid email address",
                            })
                        )
                            .Decode((value) => value.toLowerCase())
                            .Encode((value) => value),
                        password: t.String({
                            minLength: 8,
                            error: "Password must be at least 8 characters long",
                        }),
                        isActive: t.Optional(t.Boolean()),
                        devices: t.Optional(t.Array(t.String())),
                        dialCode: t.String({
                            minLength: 2,
                            maxLength: 4,
                            pattern: "^\\+[0-9]{1,3}$",
                            error: "Dial code must be in the format +XX (e.g. +91)",
                        }),
                        mobile: t.String({
                            minLength: 1,
                            maxLength: 15,
                            pattern: "^[0-9]{4,15}$",
                            error: "Mobile number must valid",
                        }),
                    }),
                },)
    }
}