import type { PublicUser } from "../users/users.schema";

export type NewUser = {
    user: PublicUser;
    token: string;
};

export type EmailLoginUser = {
    email: string;
    password: string;
};

export type MobileLoginUser = {
    dialCode: string;
    mobile: string;
    password: string;
};
