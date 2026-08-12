import { Elysia } from "elysia";
import { UsersService } from "./users.service";

export class UsersController {
    private readonly usersService: UsersService;

    constructor() {
        this.usersService = new UsersService();
    }

    getRoutes() {
        return new Elysia({
            prefix: "/users",
        })
            .get("/", () => {
                return this.usersService.getUsers();
            })

            .get("/:id", ({ params, set }) => {
                const response = this.usersService.getUserById(
                    Number(params.id),
                );

                return response;
            });
    }
}