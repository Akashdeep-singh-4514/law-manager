import Elysia, { t } from "elysia";
import { logError } from "../../utils/logger";
import { userEmailLoginValidator, userMobileLoginValidator, usersPostValidator } from "../users/user.validate";
import type { AuthResult, EmailLoginUser, LogoutInput, MobileLoginUser, RefreshTokenInput, TokenPair } from "./auth.schema";
import { AuthService } from "./auth.service";
import { idValidator, refreshTokenValidator } from "../../utils/validator";
import { HTTPCodes, MyError } from "../../utils/errorHandling";



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
                        // NOTE: awaiting here (previous version returned the bare
                        // promise, so a rejection would skip this catch block).
                        return await this.authService.signup(body);
                    } catch (e) {
                        logError(e, "register user");
                        throw e;
                    }
                },
                {
                    body: usersPostValidator,
                },
            )
            .post(
                "/signin/email",
                async ({ body }): Promise<AuthResult> => {
                    try {
                        return await this.authService.emailSignin(body as EmailLoginUser);
                    } catch (e) {
                        logError(e, "login user");
                        throw e;
                    }
                },
                {
                    body: userEmailLoginValidator,
                },
            )
            .post(
                "/signin/mobile",
                async ({ body }): Promise<AuthResult> => {
                    try {
                        return await this.authService.mobileSignin(body as MobileLoginUser);
                    } catch (e) {
                        logError(e, "login user");
                        throw e;
                    }
                },
                {
                    body: userMobileLoginValidator,
                },
            )
            .post(
                "/refresh",
                async ({ body }): Promise<TokenPair> => {
                    try {
                        return await this.authService.refresh(body as RefreshTokenInput);
                    } catch (e) {
                        logError(e, "refresh token");
                        throw e;
                    }
                },
                {
                    body: refreshTokenValidator,
                },
            )
            .post(
                "/logout",
                async ({ body }) => {
                    try {
                        return await this.authService.logout(body as LogoutInput);
                    } catch (e) {
                        logError(e, "logout user");
                        throw e;
                    }
                },
                {
                    body: refreshTokenValidator,
                },
            )
        .post(
            "/logoutall/:id",
            async ({ params }) => {
              try {
                if (!params.id) {
                    throw new MyError("id is required",HTTPCodes.BAD_REQUEST)
                }
                    return await this.authService.logoutAll(Number(params.id));
                } catch (e) {
                    logError(e, "logout user");
                    throw e;
                }
            },
            {
              params: t.Object({
                  id:idValidator
                }),
            },
        );
    }
}
