import Elysia from "elysia";
import { UsersController } from "./modules/users/user.controller";
import { AuthController } from "./modules/auth/auth.controller";

const usersController = new UsersController();
const authController = new AuthController();

const mainRouter = new Elysia({
  prefix: "/v1",
})
  .use(usersController.getRoutes())
  .use(authController.getRoutes());

export { mainRouter };
