import { t } from "elysia";
import { FormatRegistry } from "@sinclair/typebox";

// "email" isn't a built-in TypeBox format — it must be registered before
// any schema using `format: "email"` is compiled/checked, or every value
// fails with "Unknown format 'email'".
if (!FormatRegistry.Has("email")) {
    FormatRegistry.Set(
        "email",
        (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    );
}

export const usersValidator = t.Object({
    name: t.String({
        minLength: 1,
        maxLength: 255,
        error: "Name is required and must be under 255 characters",
    }),
    email: t.Transform(
        t.String({
            format: "email",
            error: "Please enter a valid email address",
        })
    )
        .Decode((value) => value.toLowerCase())
        .Encode((value) => value),
    password: t.String({
        minLength: 8,
        error: "Password must be at least 8 characters long",
    }),
    isActive: t.Optional(t.Boolean()),
    devices: t.Optional(t.Array(t.String())),
    dialCode: t.String({
        minLength: 2,
        maxLength: 4,
        pattern: "^\\+[0-9]{1,3}$",
        error: "Dial code must be in the format +XX (e.g. +91)",
    }),
    mobile: t.String({
        minLength: 1,
        maxLength: 15,
        pattern: "^[0-9]{4,15}$",
        error: "Mobile number must valid",
    }),
})