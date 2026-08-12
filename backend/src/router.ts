import Elysia from "elysia";
import { UsersController } from "./modules/users/user.controller";

const usersController = new UsersController();

const mainRouter = new Elysia({
    prefix: "/v1",
})
    .use(usersController.getRoutes());

export { mainRouter };