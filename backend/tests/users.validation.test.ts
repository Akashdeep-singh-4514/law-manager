import { describe, it, expect } from "bun:test";
import { Value } from "@sinclair/typebox/value";
import { usersPostValidator as createUserBody } from "../src/modules/users/user.validate";

const validPayload = {
    name: "Jane Doe",
    email: "jane@example.com",
    password: "password123",
    dialCode: "+91",
    mobile: "9876543210",
};

function errorsFor(payload: unknown) {
    return [...Value.Errors(createUserBody, payload)];
}

describe("createUserBody schema", () => {
    it("accepts a fully valid payload", () => {
        expect(Value.Check(createUserBody, validPayload)).toBe(true);
    });

    it("accepts optional fields when provided", () => {
        const withOptionals = {
            ...validPayload,
            isActive: true,
            devices: ["device-token-1"],
        };
        expect(Value.Check(createUserBody, withOptionals)).toBe(true);
    });

    describe("name", () => {
        it("rejects an empty name", () => {
            const errors = errorsFor({ ...validPayload, name: "" });
            expect(errors.some((e) => e.path === "/name")).toBe(true);
        });

        it("rejects a name over 255 characters", () => {
            const errors = errorsFor({ ...validPayload, name: "a".repeat(256) });
            expect(errors.some((e) => e.path === "/name")).toBe(true);
        });
    });

    describe("email", () => {
        it("rejects a malformed email with the correct message", () => {
            const errors = errorsFor({ ...validPayload, email: "not-an-email" });
            const emailError = errors.find((e) => e.path === "/email");
            expect(emailError?.schema.error).toBe("Please enter a valid email address");
        });

        it("lowercases the email on decode", () => {
            const decoded = Value.Decode(createUserBody, {
                ...validPayload,
                email: "Jane.Doe@EXAMPLE.com",
            });
            expect(decoded.email).toBe("jane.doe@example.com");
        });
    });

    describe("password", () => {
        it("rejects a password under 8 characters", () => {
            const errors = errorsFor({ ...validPayload, password: "short1" });
            const passwordError = errors.find((e) => e.path === "/password");
            expect(passwordError?.schema.error).toBe(
                "Password must be at least 8 characters long"
            );
        });
    });

    describe("dialCode", () => {
        it("rejects a dial code missing the leading +", () => {
            const errors = errorsFor({ ...validPayload, dialCode: "91" });
            expect(errors.some((e) => e.path === "/dialCode")).toBe(true);
        });

        it("rejects a dial code with letters", () => {
            const errors = errorsFor({ ...validPayload, dialCode: "+9a" });
            expect(errors.some((e) => e.path === "/dialCode")).toBe(true);
        });

        it("accepts valid dial codes of varying length", () => {
            expect(
                Value.Check(createUserBody, { ...validPayload, dialCode: "+1" })
            ).toBe(true);
            expect(
                Value.Check(createUserBody, { ...validPayload, dialCode: "+971" })
            ).toBe(true);
        });
    });

    describe("mobile", () => {
        it("rejects a mobile number containing letters", () => {
            const errors = errorsFor({ ...validPayload, mobile: "98abc43210" });
            expect(errors.some((e) => e.path === "/mobile")).toBe(true);
        });

        it("rejects a mobile number over 15 digits", () => {
            const errors = errorsFor({ ...validPayload, mobile: "1".repeat(16) });
            expect(errors.some((e) => e.path === "/mobile")).toBe(true);
        });
    });
});
