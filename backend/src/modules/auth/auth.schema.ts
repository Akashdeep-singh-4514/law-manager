import type { PublicUser, UserRoles } from "../users/users.schema";

export type AuthResult = {
    user: PublicUser;
    accessToken: string;
    refreshToken: string;
};

export type EmailLoginUser = {
    email: string;
    password: string;
    role?:UserRoles
};

export type MobileLoginUser = {
    dialCode: string;
    mobile: string;
    password: string;
    role?:UserRoles
};


export type RefreshTokenInput = {
    refreshToken: string;
};

export type LogoutInput = {
    refreshToken: string;
};

export type TokenPair = {
    accessToken: string;
    refreshToken: string;
};
