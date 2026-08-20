import bcrypt from "bcrypt";
import { randomUUID, randomBytes } from "crypto";
const saltRounds = 10;

export async function hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(password, salt);

    return hash;
}

export async function comparePassword(
    password: string,
    hashedPassword: string
): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
}


const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function newRefreshTokenId(): string {
    return randomUUID();
}

export function generateRefreshTokenSecret(): string {
    return randomBytes(32).toString("hex");
}

export async function hashRefreshTokenSecret(secret: string): Promise<string> {
    return hashPassword(secret);
}

export async function compareRefreshTokenSecret(
    secret: string,
    hashedSecret: string
): Promise<boolean> {
    return comparePassword(secret, hashedSecret);
}

export function refreshTokenExpiry(): Date {
    return new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
}

export function encodeRefreshToken(id: string, secret: string): string {
    return `${id}.${secret}`;
}

export function decodeRefreshToken(token: string): { id: string; secret: string } | null {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [id, secret] = parts;
    if (!id || !secret) return null;
    return { id, secret };
}
