import { env } from "../config/env";
import jwt from "jsonwebtoken";

const ACCESS_TOKEN_SECRET = env.jwtconf.secret;
const ACCESS_TOKEN_EXPIRES_IN = env.jwtconf.expiresIn;

export type AccessTokenPayload = {
    userId: number;
    email: string;
};

export function signAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
        expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
    return jwt.verify(token, ACCESS_TOKEN_SECRET) as AccessTokenPayload;
}
