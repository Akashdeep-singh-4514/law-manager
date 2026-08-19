import { t } from "elysia";
import {
    booleanValidator,
    dialCodeValidator,
    emailValidator,
    mobileValidator,
    nameValidator,
    passwordValidator,
    stringArrayValidator,
} from "../../utils/validator";

export const usersPostValidator = t.Object({
    name: nameValidator(),
    email: emailValidator(),
    password: passwordValidator(),
    isActive: t.Optional(booleanValidator()),
    devices: t.Optional(stringArrayValidator()),
    dialCode: dialCodeValidator(),
    mobile: mobileValidator(),
});

export const usersUpdateValidator = t.Object({
    name: t.Optional(nameValidator()),
    email: t.Optional(emailValidator()),
    isActive: t.Optional(booleanValidator()),
    devices: t.Optional(stringArrayValidator()),
    dialCode: t.Optional(dialCodeValidator()),
    mobile: t.Optional(mobileValidator()),
});

export const userEmailLoginValidator = t.Object({
    email: emailValidator(),
    password: passwordValidator(),
});

export const userMobileLoginValidator = t.Object({
    dialCode: dialCodeValidator(),
    mobile: mobileValidator(),
    password: passwordValidator(),
});
