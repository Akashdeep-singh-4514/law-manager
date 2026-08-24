import { HTTPCodes, MyError } from "../../utils/errorHandling";
import {
    comparePassword,
    compareRefreshTokenSecret,
    decodeRefreshToken,
    encodeRefreshToken,
    generateRefreshTokenSecret,
    hashRefreshTokenSecret,
    newRefreshTokenId,
    refreshTokenExpiry,
} from "../../utils/bcrypt";
import { signAccessToken } from "../../utils/jwt";
import { UserRoles, type CreateUser, type PublicUser } from "../users/users.schema";
import { UsersService } from "../users/users.service";
import { RefreshTokenRepository } from "../refresh/refresh.repository";
import type {
    AuthResult,
    EmailLoginUser,
    LogoutInput,
    MobileLoginUser,
    RefreshTokenInput,
    TokenPair,
} from "./auth.schema";

export class AuthService {
    private readonly userService: UsersService;
    private readonly refreshTokenRepository: RefreshTokenRepository;

    constructor() {
        this.userService = new UsersService();
        this.refreshTokenRepository = new RefreshTokenRepository();
    }

    private issueTokenPair = async (user: PublicUser, role: UserRoles): Promise<TokenPair> => {
        const accessToken = signAccessToken({ userId: user.id, email: user.email, role });

        const id = newRefreshTokenId();
        const secret = generateRefreshTokenSecret();
        const tokenHash = await hashRefreshTokenSecret(secret);

        await this.refreshTokenRepository.create({
            id,
            userId: user.id,
            tokenHash,
            expiresAt: refreshTokenExpiry(),
        });

        return { accessToken, refreshToken: encodeRefreshToken(id, secret) };
    };

    signup = async (user: CreateUser): Promise<AuthResult> => {
        const res = await this.userService.postUser(user);
        if (!res) throw new MyError("cannot signup", HTTPCodes.NOT_MODIFIED);
        const { accessToken, refreshToken } = await this.issueTokenPair(res,UserRoles.USER);
        return { user: res, accessToken, refreshToken };
    };

    emailSignin = async (user: EmailLoginUser): Promise<AuthResult> => {
        const res = await this.userService.getUserByEmailUnsafe(user.email);
        if (!res) throw new MyError("user not found", HTTPCodes.NOT_FOUND);

        if (!res.isActive) {
            throw new MyError("user account is inactive", HTTPCodes.UNAUTHORIZED);
        }

        const matched = await comparePassword(user.password, res.password);

        if (!matched) {
            throw new MyError("invalid credential", HTTPCodes.UNAUTHORIZED);
        }

        const { password: _, ...safeUser } = res;
        const { accessToken, refreshToken } = await this.issueTokenPair(safeUser,res.role??UserRoles.USER);

        return { user: safeUser, accessToken, refreshToken };
    };

    mobileSignin = async (user: MobileLoginUser): Promise<AuthResult> => {
        const res = await this.userService.getUserByPhoneUnsafe(user.dialCode, user.mobile);

        if (!res) throw new MyError("user not found", HTTPCodes.NOT_FOUND);

        if (!res.isActive) {
            throw new MyError("user account is inactive", HTTPCodes.UNAUTHORIZED);
        }

        const matched = await comparePassword(user.password, res.password);

        if (!matched) {
            throw new MyError("invalid credential", HTTPCodes.UNAUTHORIZED);
        }

        if (user.role && user.role!=res.role) {
            throw new MyError("invalid credential",HTTPCodes.BAD_REQUEST)
        }

        const { password: _, ...safeUser } = res;
        const { accessToken, refreshToken } = await this.issueTokenPair(safeUser,user.role??UserRoles.USER);

        return { user: safeUser, accessToken, refreshToken };
    };

    refresh = async ({ refreshToken }: RefreshTokenInput): Promise<TokenPair> => {
        const decoded = decodeRefreshToken(refreshToken);
        if (!decoded) throw new MyError("invalid refresh token", HTTPCodes.UNAUTHORIZED);

        const existing = await this.refreshTokenRepository.findById(decoded.id);
        if (!existing) throw new MyError("invalid refresh token", HTTPCodes.UNAUTHORIZED);

        const secretMatches = await compareRefreshTokenSecret(decoded.secret, existing.tokenHash);
        if (!secretMatches) {
            throw new MyError("invalid refresh token", HTTPCodes.UNAUTHORIZED);
        }

        if (existing.revokedAt) {
            await this.refreshTokenRepository.revokeAllForUser(existing.userId);
            throw new MyError("refresh token reuse detected", HTTPCodes.UNAUTHORIZED);
        }

        if (existing.expiresAt.getTime() < Date.now()) {
            throw new MyError("refresh token expired", HTTPCodes.UNAUTHORIZED);
        }

        const user = await this.userService.getUserById(existing.userId);
        if (!user) throw new MyError("user not found", HTTPCodes.NOT_FOUND);

        if (!user.isActive) {
            throw new MyError("user account is inactive", HTTPCodes.UNAUTHORIZED);
        }

        const newId = newRefreshTokenId();
        const newSecret = generateRefreshTokenSecret();

        await this.refreshTokenRepository.create({
            id: newId,
            userId: existing.userId,
            tokenHash: await hashRefreshTokenSecret(newSecret),
            expiresAt: refreshTokenExpiry(),
        });
        await this.refreshTokenRepository.revoke(existing.id, newId);

                
        const accessToken = signAccessToken({ userId: user.id, email: user.email ,role:user.role??UserRoles.USER});
        return { accessToken, refreshToken: encodeRefreshToken(newId, newSecret) };
    };

    logout = async ({ refreshToken }: LogoutInput): Promise<{ success: true }> => {
        const decoded = decodeRefreshToken(refreshToken);
        if (!decoded) throw new MyError("invalid refresh token", HTTPCodes.UNAUTHORIZED);

        const existing = await this.refreshTokenRepository.findById(decoded.id);
        if (existing && !existing.revokedAt) {
            const secretMatches = await compareRefreshTokenSecret(
                decoded.secret,
                existing.tokenHash,
            );
            if (secretMatches) {
                await this.refreshTokenRepository.revoke(existing.id);
            }
        }

        return { success: true };
    };

    logoutAll = async (userId: number): Promise<{ success: true }> => {
        await this.refreshTokenRepository.revokeAllForUser(userId);
        return { success: true };
    };
    me = async (userId: number): Promise<PublicUser> => {
        const user = await this.userService.getUserById(userId);
        if (!user) throw new MyError("user not found", HTTPCodes.NOT_FOUND);
        if (!user.isActive) {
            throw new MyError("user account is inactive", HTTPCodes.UNAUTHORIZED);
        }
        return user;
    };
}
