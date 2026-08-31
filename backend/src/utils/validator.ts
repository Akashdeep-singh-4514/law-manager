import { t } from "elysia";
import { FormatRegistry } from "@sinclair/typebox";


if (!FormatRegistry.Has("email")) {
    FormatRegistry.Set(
        "email",
        (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    );
}

export const idValidator = t.Object({
    id: t.Number({ minimum: 1 })
});

export const genderValidator = () => {
  return t.Number({
    minimum: 1,
    maximum:3
  });
}


export function stringValidator(field:string) {
    return t.String({
        minLength: 1,
        maxLength: 255,
        error: `${field} is required and must be under 255 characters`,
    });
}
export function nameValidator() {
    return t.String({
        minLength: 1,
        maxLength: 255,
        error: "Name is required and must be under 255 characters",
    });
}

export function emailValidator() {
    return t.Transform(
        t.String({
            format: "email",
            error: "Please enter a valid email address",
        })
    )
        .Decode((value) => value.toLowerCase().trim())
        .Encode((value) => value);
}


export function passwordValidator() {
    return t.String({
        minLength: 8,
        error: "Password must be at least 8 characters long",
    });
}

export function dialCodeValidator() {
    return t.String({
        minLength: 2,
        maxLength: 4,
        pattern: "^\\+[0-9]{1,3}$",
        error: "Dial code must be in the format +XX (e.g. +91)",
    });
}

export function mobileValidator() {
    return t.String({
        minLength: 4,
        maxLength: 15,
        pattern: "^[0-9]{4,15}$",
        error: "Mobile number must contain 4 to 15 digits",
    });
}

export function booleanValidator() {
    return t.Boolean();
}

export function stringArrayValidator() {
    return t.Array(t.String());
}

export const refreshTokenValidator = t.Object({
    refreshToken: t.String(),
});
