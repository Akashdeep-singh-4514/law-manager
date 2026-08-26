import Elysia from "elysia";
import { UsersController } from "./modules/users/user.controller";
import { AuthController } from "./modules/auth/auth.controller";
import { AdminController } from "./modules/users/admin.controller";

const usersController = new UsersController();
const authController = new AuthController();
const adminController= new AdminController();

const mainRouter = new Elysia({
  prefix: "/v1",
})
  .use(usersController.getRoutes())
  .use(authController.getRoutes())
  .use(adminController.getRoutes());

export { mainRouter };
