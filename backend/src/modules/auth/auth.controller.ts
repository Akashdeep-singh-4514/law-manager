import Elysia from "elysia";
import { logError } from "../../utils/logger";
import { userEmailLoginValidator, userMobileLoginValidator, usersPostValidator } from "../users/user.validate";
import type { EmailLoginUser, MobileLoginUser, AuthResult } from "./auth.schema";
import { AuthService } from "./auth.service";

export class AuthController {
    private readonly authService: AuthService;
    constructor() {
        this.authService = new AuthService();
    }
    getRoutes() {
        return new Elysia({
            prefix: "/auth",
        })
            .post(
                "/signup",
                async ({ body }): Promise<AuthResult> => {
                    try {
                        const res = this.authService.signup(body);
                        return res;
                    } catch (e) {
                        logError(e, "register user");
                        throw e;
                    }
                },
                {
                    body: usersPostValidator,
                },
            )
            .post("/signin/email", async ({ body }) => {
                try {
                    const res = this.authService.emailSignin(body as EmailLoginUser);
                    return res;
                } catch (e) {
                    logError(e, "login user");
                    throw e;
                }
            }, {
              body: userEmailLoginValidator
            })
            .post("/signin/mobile", async ({ body }) => {
                try {
                    const res = this.authService.mobileSignin(body as MobileLoginUser);
                    return res;
                } catch (e) {
                    logError(e, "login user");
                    throw e;
                }
            }, {
              body: userMobileLoginValidator
            });
    }
}
