import {
    describe,
    it,
    expect,
    beforeAll,
    afterAll,
    afterEach,
} from "bun:test";

import { eq } from "drizzle-orm";

import { buildTestApp } from "./build-app";
import {
    connectDatabase,
    closeDatabase,
    db,
} from "../src/db";

import { users } from "../src/modules/users/users.schema";

interface User {
    id: number;
    name: string;
    email: string;
    dialCode: string;
    mobile: string;
    isActive: boolean;
    devices: string[] | null;
    password?: never;
}

interface AuthResponse {
    user: User;
    token: string;
}

interface SuccessResponse<T> {
    status: "success";
    data: T;
    message?: string;
    userfriendlymessage?: string;
}

interface ErrorResponse {
    status: "error";
    message: string;
    userfriendlymessage?: string;
    data?: unknown;
}

type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

const app = buildTestApp();

const runId = Date.now();

const testEmail =
    `auth.test.${runId}@example.com`;

const testDialCode = "+91";

const testMobile =
    `9${String(runId).slice(-9)}`;

const testPassword = "password123";

async function post(
    path: string,
    body: Record<string, unknown>,
): Promise<Response> {
    return app.handle(
        new Request(`http://localhost${path}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        }),
    );
}

async function createTestUser(): Promise<User> {
    const res = await post("/v1/users", {
        name: "Auth Test User",
        email: testEmail,
        password: testPassword,
        dialCode: testDialCode,
        mobile: testMobile,
    });

    expect(res.status).toBe(200);

    const body =
        (await res.json()) as ApiResponse<User>;

    if (body.status !== "success") {
        throw new Error(
            `Failed to create test user: ${body.message}`,
        );
    }

    return body.data;
}

beforeAll(async () => {
    await connectDatabase();
});

afterAll(async () => {
    await closeDatabase();
});

afterEach(async () => {
    await db
        .delete(users)
        .where(eq(users.email, testEmail));

    await db
        .delete(users)
        .where(
            eq(
                users.email,
                `duplicate.${testEmail}`,
            ),
        );

    await db
        .delete(users)
        .where(
            eq(
                users.email,
                `second.${testEmail}`,
            ),
        );
});


describe("POST /v1/auth/signup", () => {
    it(
        "creates a user successfully",
        async () => {
            const res = await post(
                "/v1/auth/signup",
                {
                    name: "Auth Signup User",
                    email: testEmail,
                    password: testPassword,
                    dialCode: testDialCode,
                    mobile: testMobile,
                },
            );

            expect(res.status).toBe(200);

            const body =
                (await res.json()) as SuccessResponse<AuthResponse>;

            expect(body.status).toBe("success");

            expect(body.data.user.id)
                .toBeDefined();

            expect(body.data.user.name)
                .toBe("Auth Signup User");

            expect(body.data.user.email)
                .toBe(testEmail);

            expect(body.data.user.dialCode)
                .toBe(testDialCode);

            expect(body.data.user.mobile)
                .toBe(testMobile);

            expect(body.data.user.password)
                .toBeUndefined();

            expect(body.data.token)
                .toBe("");
        },
    );

    it(
        "rejects invalid email",
        async () => {
            const res = await post(
                "/v1/auth/signup",
                {
                    name: "Auth Signup User",
                    email: "invalid-email",
                    password: testPassword,
                    dialCode: testDialCode,
                    mobile: testMobile,
                },
            );

            expect(res.status).toBe(422);

            const body =
                (await res.json()) as ErrorResponse;

            expect(
                JSON.stringify(body),
            ).toContain("valid email");
        },
    );

    it(
        "rejects signup when required fields are missing",
        async () => {
            const res = await post(
                "/v1/auth/signup",
                {
                    email: testEmail,
                },
            );

            expect(res.status).toBeGreaterThanOrEqual(400);
            expect(res.status).toBeLessThan(500);
        },
    );

    it(
        "rejects duplicate email",
        async () => {
            await post("/v1/auth/signup", {
                name: "First User",
                email: testEmail,
                password: testPassword,
                dialCode: testDialCode,
                mobile: testMobile,
            });

            const res = await post(
                "/v1/auth/signup",
                {
                    name: "Duplicate User",
                    email: testEmail,
                    password: testPassword,
                    dialCode: testDialCode,
                    mobile:
                        `8${String(runId).slice(-9)}`,
                },
            );

            expect(res.status).toBe(409);

            const body =
                (await res.json()) as ErrorResponse;

            expect(body.message)
                .toContain("email already exists");
        },
    );

    it(
        "rejects duplicate dialCode and mobile",
        async () => {
            await post("/v1/auth/signup", {
                name: "First User",
                email: testEmail,
                password: testPassword,
                dialCode: testDialCode,
                mobile: testMobile,
            });

            const duplicateEmail =
                `duplicate.${testEmail}`;

            const res = await post(
                "/v1/auth/signup",
                {
                    name: "Duplicate Mobile User",
                    email: duplicateEmail,
                    password: testPassword,
                    dialCode: testDialCode,
                    mobile: testMobile,
                },
            );

            expect(res.status).toBe(409);

            const body =
                (await res.json()) as ErrorResponse;

            expect(body.message)
                .toContain(
                    "mobile number already exists",
                );
        },
    );
});


describe("POST /v1/auth/signin/email", () => {
    it(
        "signs in successfully with valid email and password",
        async () => {
            const user = await createTestUser();

            const res = await post(
                "/v1/auth/signin/email",
                {
                    email: testEmail,
                    password: testPassword,
                },
            );

            expect(res.status).toBe(200);

            const body =
                (await res.json()) as SuccessResponse<AuthResponse>;

            expect(body.status).toBe("success");

            expect(body.data.user.id)
                .toBe(user.id);

            expect(body.data.user.name)
                .toBe("Auth Test User");

            expect(body.data.user.email)
                .toBe(testEmail);

            expect(body.data.user.dialCode)
                .toBe(testDialCode);

            expect(body.data.user.mobile)
                .toBe(testMobile);

            expect(body.data.user.password)
              .toBeUndefined();

            expect(body.data.token)
                .toBe("");
        },
    );

    it(
        "returns 401 for an incorrect password",
        async () => {
            await createTestUser();

            const res = await post(
                "/v1/auth/signin/email",
                {
                    email: testEmail,
                    password: "wrong-password",
                },
            );

            expect(res.status).toBe(401);

            const body =
                (await res.json()) as ErrorResponse;

            expect(body.message)
                .toContain("invalid credential");
        },
    );

    it(
        "returns an error when email does not exist",
        async () => {
            const res = await post(
                "/v1/auth/signin/email",
                {
                    email:
                        `not-found.${testEmail}`,
                    password: testPassword,
                },
            );

            expect(res.status).toBeGreaterThanOrEqual(400);
            expect(res.status).toBeLessThan(500);
        },
    );

    it(
        "rejects invalid email",
        async () => {
            const res = await post(
                "/v1/auth/signin/email",
                {
                    email: "invalid-email",
                    password: testPassword,
                },
            );

            expect(res.status).toBe(422);

            const body =
                (await res.json()) as ErrorResponse;

            expect(
                JSON.stringify(body),
            ).toContain("valid email");
        },
    );

    it(
        "rejects missing password",
        async () => {
            const res = await post(
                "/v1/auth/signin/email",
                {
                    email: testEmail,
                },
            );

            expect(res.status).toBeGreaterThanOrEqual(400);
            expect(res.status).toBeLessThan(500);
        },
    );

    it(
        "rejects missing email",
        async () => {
            const res = await post(
                "/v1/auth/signin/email",
                {
                    password: testPassword,
                },
            );

            expect(res.status).toBeGreaterThanOrEqual(400);
            expect(res.status).toBeLessThan(500);
        },
    );
});


describe("POST /v1/auth/signin/mobile", () => {
    it(
        "signs in successfully with valid mobile and password",
        async () => {
            const user = await createTestUser();

            const res = await post(
                "/v1/auth/signin/mobile",
                {
                    dialCode: testDialCode,
                    mobile: testMobile,
                    password: testPassword,
                },
            );

            expect(res.status).toBe(200);

            const body =
                (await res.json()) as SuccessResponse<AuthResponse>;

            expect(body.status).toBe("success");

            expect(body.data.user.id)
                .toBe(user.id);

            expect(body.data.user.name)
                .toBe("Auth Test User");

            expect(body.data.user.email)
                .toBe(testEmail);

            expect(body.data.user.dialCode)
                .toBe(testDialCode);

            expect(body.data.user.mobile)
                .toBe(testMobile);

            expect(body.data.user.password)
              .toBeUndefined();

            expect(body.data.token)
                .toBe("");
        },
    );

    it(
        "returns 401 for an incorrect password",
        async () => {
            await createTestUser();

            const res = await post(
                "/v1/auth/signin/mobile",
                {
                    dialCode: testDialCode,
                    mobile: testMobile,
                    password: "wrong-password",
                },
            );
            expect(res.status).toBe(401);

            const body =
                (await res.json()) as ErrorResponse;

            expect(body.message)
                .toContain("invalid credential");
        },
    );

    it(
        "returns an error when mobile does not exist",
        async () => {
            const res = await post(
                "/v1/auth/signin/mobile",
                {
                    dialCode: testDialCode,
                    mobile:
                        `8${String(runId).slice(-9)}`,
                    password: testPassword,
                },
            );

            expect(res.status).toBeGreaterThanOrEqual(400);
            expect(res.status).toBeLessThan(500);
        },
    );

    it(
        "rejects missing dialCode",
        async () => {
            const res = await post(
                "/v1/auth/signin/mobile",
                {
                    mobile: testMobile,
                    password: testPassword,
                },
            );

            expect(res.status).toBeGreaterThanOrEqual(400);
            expect(res.status).toBeLessThan(500);
        },
    );

    it(
        "rejects missing mobile",
        async () => {
            const res = await post(
                "/v1/auth/signin/mobile",
                {
                    dialCode: testDialCode,
                    password: testPassword,
                },
            );

            expect(res.status).toBeGreaterThanOrEqual(400);
            expect(res.status).toBeLessThan(500);
        },
    );

    it(
        "rejects missing password",
        async () => {
            const res = await post(
                "/v1/auth/signin/mobile",
                {
                    dialCode: testDialCode,
                    mobile: testMobile,
                },
            );

            expect(res.status).toBeGreaterThanOrEqual(400);
            expect(res.status).toBeLessThan(500);
        },
    );
});


describe("Auth route validation", () => {
    it(
        "returns 404 for an unknown auth endpoint",
        async () => {
            const res = await post(
                "/v1/auth/unknown",
                {},
            );

            expect(res.status).toBe(404);
        },
    );

    it(
        "returns 404 for GET /v1/auth/signup",
        async () => {
            const res = await app.handle(
                new Request(
                    "http://localhost/v1/auth/signup",
                    {
                        method: "GET",
                    },
                ),
            );

            expect(res.status).toBe(404);
        },
    );
});
