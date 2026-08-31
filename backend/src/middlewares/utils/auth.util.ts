import { HTTPCodes, MyError } from "../../utils/errorHandling";
import { verifyAccessToken, type AccessTokenPayload } from "../../utils/jwt";

export function extractBearerToken(authorization: string | undefined): string {
    if (!authorization) {
        throw new MyError("missing authorization header", HTTPCodes.UNAUTHORIZED);
    }

    const [scheme, token, ...extra] = authorization.trim().split(/\s+/);

    if (scheme !== "Bearer" || !token || extra.length > 0) {
        throw new MyError(
            "authorization header must be in the form 'Bearer <token>'",
            HTTPCodes.UNAUTHORIZED,
        );
    }

    return token;
}

export function authenticate(authorization: string | undefined): AccessTokenPayload {
    try {
        const token = extractBearerToken(authorization);

        return verifyAccessToken(token);
    } catch {
        throw new MyError("invalid or expired access token", HTTPCodes.UNAUTHORIZED);
    }
}
