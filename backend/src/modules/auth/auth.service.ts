import { comparePassword } from "../../utils/bcrypt";
import { HTTPCodes, MyError } from "../../utils/errorHandling";
import type { CreateUser } from "../users/users.schema";
import { UsersService } from "../users/users.service";
import type { EmailLoginUser, MobileLoginUser, AuthResult } from "./auth.schema";

export class AuthService {
    private readonly userService: UsersService;

    constructor() {
        this.userService = new UsersService();
    }

    signup = async (user: CreateUser): Promise<AuthResult> => {
        const res = await this.userService.postUser(user);
        if (!res) throw new MyError("cannot signup", HTTPCodes.NOT_MODIFIED);
        return { user: res,accessToken:"",refreshToken:""};
    };

    emailSignin = async (user: EmailLoginUser): Promise<AuthResult> => {
        const res = await this.userService.getUserByEmailUnsafe(user.email);
        if (!res) throw new MyError("user not found", HTTPCodes.NOT_FOUND);
        const matched = await comparePassword(user.password, res.password);
        if (!matched) {
            throw new MyError("invalid credential", HTTPCodes.UNAUTHORIZED);
        }
        const { password: _, ...safeUser } = res;
        return { user: safeUser,accessToken:"",refreshToken:""};
    };

    mobileSignin = async (user: MobileLoginUser): Promise<AuthResult> => {
        const res = await this.userService.getUserByPhoneUnsafe(user.dialCode, user.mobile);
        if (!res) throw new MyError("user not found", HTTPCodes.NOT_FOUND);
        const matched = await comparePassword(user.password, res.password);
        if (!matched) {
            throw new MyError("invalid credential", HTTPCodes.UNAUTHORIZED);
        }
        const { password: _, ...safeUser } = res;
      return { user: safeUser, accessToken: "", refreshToken: "" };
    };
}
