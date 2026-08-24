import { env } from "../config/env";
import jwt from "jsonwebtoken";
import type { UserRoles } from "../modules/users/users.schema";

const ACCESS_TOKEN_SECRET = env.jwtconf.secret;
const ACCESS_TOKEN_EXPIRES_IN = env.jwtconf.expiresIn;

export type AccessTokenPayload = {
    userId: number;
    email: string;
    role: UserRoles
};

export function signAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
        expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
    return jwt.verify(token, ACCESS_TOKEN_SECRET) as AccessTokenPayload;
}
