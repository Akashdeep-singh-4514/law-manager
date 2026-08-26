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

import { users, UserRoles } from "../src/modules/users/users.schema";

interface User {
    id: number;
    name: string;
    email: string;
    dialCode: string;
    mobile: string;
    isActive: boolean;
    role: UserRoles;
    devices: string[];
    password?: never;
}

interface AuthResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
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
const testEmail = `auth.test.${runId}@example.com`;
const testDialCode = "+91";
const testMobile = `9${String(runId).slice(-9)}`;
const testPassword = "password123";

async function post(
    path: string,
    body: Record<string, unknown>,
    accessToken?: string,
): Promise<Response> {
    return app.handle(
        new Request(`http://localhost${path}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(accessToken
                    ? { Authorization: `Bearer ${accessToken}` }
                    : {}),
            },
            body: JSON.stringify(body),
        }),
    );
}

async function get(
    path: string,
    accessToken?: string,
): Promise<Response> {
    return app.handle(
        new Request(`http://localhost${path}`, {
            headers: accessToken
                ? { Authorization: `Bearer ${accessToken}` }
                : undefined,
        }),
    );
}

async function signup(
    overrides: Record<string, unknown> = {},
): Promise<AuthResponse> {
    const res = await post("/v1/auth/signup", {
        name: "Auth Test User",
        email: testEmail,
        password: testPassword,
        dialCode: testDialCode,
        mobile: testMobile,
        ...overrides,
    });

    expect(res.status).toBe(200);

    const body = (await res.json()) as ApiResponse<AuthResponse>;

    if (body.status !== "success") {
        throw new Error(`Failed to signup test user: ${body.message}`);
    }

    return body.data;
}

async function signinEmail(
    email = testEmail,
    password = testPassword,
): Promise<Response> {
    return post("/v1/auth/signin/email", {
        email,
        password,
    });
}

async function signinMobile(
    dialCode = testDialCode,
    mobile = testMobile,
    password = testPassword,
): Promise<Response> {
    return post("/v1/auth/signin/mobile", {
        dialCode,
        mobile,
        password,
    });
}

async function cleanupByEmails(...emails: string[]) {
    for (const email of emails) {
        await db.delete(users).where(eq(users.email, email));
    }
}

beforeAll(async () => {
    await connectDatabase();
});

afterAll(async () => {
    await closeDatabase();
});

afterEach(async () => {
    await cleanupByEmails(
        testEmail,
        `duplicate.${testEmail}`,
        `second.${testEmail}`,
        `inactive.${testEmail}`,
        `mobile.inactive.${testEmail}`,
        `refresh.inactive.${testEmail}`,
        `me.inactive.${testEmail}`,
    );
});

describe("POST /v1/auth/signup", () => {
    it("creates a user and issues access + refresh tokens", async () => {
        const res = await post("/v1/auth/signup", {
            name: "Auth Signup User",
            email: testEmail,
            password: testPassword,
            dialCode: testDialCode,
            mobile: testMobile,
        });

        expect(res.status).toBe(200);

        const body = (await res.json()) as SuccessResponse<AuthResponse>;

        expect(body.status).toBe("success");
        expect(body.data.user.email).toBe(testEmail);
        expect(body.data.user.role).toBe(UserRoles.USER);
        expect(body.data.user.password).toBeUndefined();

        expect(typeof body.data.accessToken).toBe("string");
        expect(body.data.accessToken.length).toBeGreaterThan(0);

        expect(typeof body.data.refreshToken).toBe("string");
        expect(body.data.refreshToken.length).toBeGreaterThan(0);
        expect(body.data.refreshToken).toContain(".");
    });

    it("rejects an invalid email", async () => {
        const res = await post("/v1/auth/signup", {
            name: "Auth Signup User",
            email: "invalid-email",
            password: testPassword,
            dialCode: testDialCode,
            mobile: testMobile,
        });

        expect(res.status).toBe(422);

        const body = (await res.json()) as ErrorResponse;
        expect(JSON.stringify(body)).toContain("valid email");
    });

    it("rejects missing required fields", async () => {
        const res = await post("/v1/auth/signup", {
            email: testEmail,
        });

        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.status).toBeLessThan(500);
    });

    it("rejects duplicate email", async () => {
        await signup();

        const res = await post("/v1/auth/signup", {
            name: "Duplicate User",
            email: testEmail,
            password: testPassword,
            dialCode: testDialCode,
            mobile: `8${String(runId).slice(-9)}`,
        });

        expect(res.status).toBe(409);

        const body = (await res.json()) as ErrorResponse;
        expect(body.message).toContain("email already exists");
    });

    it("rejects duplicate dialCode + mobile", async () => {
        await signup();

        const duplicateEmail = `duplicate.${testEmail}`;

        const res = await post("/v1/auth/signup", {
            name: "Duplicate Mobile User",
            email: duplicateEmail,
            password: testPassword,
            dialCode: testDialCode,
            mobile: testMobile,
        });

        expect(res.status).toBe(409);

        const body = (await res.json()) as ErrorResponse;
        expect(body.message).toContain("mobile number already exists");
    });
});

describe("POST /v1/auth/signin/email", () => {
    it("signs in successfully and returns the user's role", async () => {
        const user = await signup();

        const res = await signinEmail();

        expect(res.status).toBe(200);

        const body = (await res.json()) as SuccessResponse<AuthResponse>;

        expect(body.status).toBe("success");
        expect(body.data.user.id).toBe(user.user.id);
        expect(body.data.user.email).toBe(testEmail);
        expect(body.data.user.role).toBe(UserRoles.USER);
        expect(body.data.user.password).toBeUndefined();

        expect(body.data.accessToken).toBeTruthy();
        expect(body.data.refreshToken).toBeTruthy();
    });

    it("returns 401 for an incorrect password", async () => {
        await signup();

        const res = await signinEmail(testEmail, "wrong-password");

        expect(res.status).toBe(401);

        const body = (await res.json()) as ErrorResponse;
        expect(body.message).toContain("invalid credential");
    });

    it("returns an error when email does not exist", async () => {
        const res = await signinEmail(
            `not-found.${testEmail}`,
            testPassword,
        );

        expect(res.status).toBe(404);
    });

    it("rejects an invalid email", async () => {
        const res = await signinEmail("invalid-email");

        expect(res.status).toBe(422);

        const body = (await res.json()) as ErrorResponse;
        expect(JSON.stringify(body)).toContain("valid email");
    });

    it("rejects a missing password", async () => {
        const res = await post("/v1/auth/signin/email", {
            email: testEmail,
        });

        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.status).toBeLessThan(500);
    });

    it("rejects an inactive user", async () => {
        const email = `inactive.${testEmail}`;

        await signup({ email });

        await db
            .update(users)
            .set({ isActive: false })
            .where(eq(users.email, email));

        const res = await signinEmail(email);

        expect(res.status).toBe(401);

        const body = (await res.json()) as ErrorResponse;
        expect(body.message).toContain("user account is inactive");
    });
});

describe("POST /v1/auth/signin/mobile", () => {
    it("signs in successfully with valid mobile credentials", async () => {
        const user = await signup();

        const res = await signinMobile();

        expect(res.status).toBe(200);

        const body = (await res.json()) as SuccessResponse<AuthResponse>;

        expect(body.status).toBe("success");
        expect(body.data.user.id).toBe(user.user.id);
        expect(body.data.user.email).toBe(testEmail);
        expect(body.data.user.role).toBe(UserRoles.USER);
        expect(body.data.user.password).toBeUndefined();

        expect(body.data.accessToken).toBeTruthy();
        expect(body.data.refreshToken).toBeTruthy();
    });

    it("returns 401 for an incorrect password", async () => {
        await signup();

        const res = await signinMobile(
            testDialCode,
            testMobile,
            "wrong-password",
        );

        expect(res.status).toBe(401);

        const body = (await res.json()) as ErrorResponse;
        expect(body.message).toContain("invalid credential");
    });

    it("returns 404 when the mobile number does not exist", async () => {
        const res = await signinMobile(
            testDialCode,
            `8${String(runId).slice(-9)}`,
        );

        expect(res.status).toBe(404);
    });

    it("returns 401 for an inactive user", async () => {
        const email = `mobile.inactive.${testEmail}`;
        const mobile = `8${String(runId).slice(-9)}`;

        await signup({
            email,
            mobile,
        });

        await db
            .update(users)
            .set({ isActive: false })
            .where(eq(users.email, email));

        const res = await signinMobile(
            testDialCode,
            mobile,
        );

        expect(res.status).toBe(401);

        const body = (await res.json()) as ErrorResponse;
        expect(body.message).toContain("user account is inactive");
    });

    it("rejects a missing password", async () => {
        const res = await post("/v1/auth/signin/mobile", {
            dialCode: testDialCode,
            mobile: testMobile,
        });

        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.status).toBeLessThan(500);
    });
});

describe("POST /v1/auth/refresh", () => {
    it("rotates the refresh token", async () => {
        const auth = await signup();

        const res = await post("/v1/auth/refresh", {
            refreshToken: auth.refreshToken,
        });

        expect(res.status).toBe(200);

        const body = (await res.json()) as SuccessResponse<{
            accessToken: string;
            refreshToken: string;
        }>;

        expect(body.status).toBe("success");
        expect(body.data.accessToken).toBeTruthy();
        expect(body.data.refreshToken).toBeTruthy();
        expect(body.data.refreshToken).not.toBe(auth.refreshToken);

        const oldTokenReuse = await post("/v1/auth/refresh", {
            refreshToken: auth.refreshToken,
        });

        expect(oldTokenReuse.status).toBe(401);
    });

    it("detects refresh token reuse and revokes the session", async () => {
        const auth = await signup();

        const first = await post("/v1/auth/refresh", {
            refreshToken: auth.refreshToken,
        });

        expect(first.status).toBe(200);

        const firstBody =
            (await first.json()) as SuccessResponse<{
                accessToken: string;
                refreshToken: string;
            }>;

        const reuse = await post("/v1/auth/refresh", {
            refreshToken: auth.refreshToken,
        });

        expect(reuse.status).toBe(401);

        const reuseBody = (await reuse.json()) as ErrorResponse;
        expect(reuseBody.message).toContain("reuse detected");

        const afterReuse = await post("/v1/auth/refresh", {
            refreshToken: firstBody.data.refreshToken,
        });

        expect(afterReuse.status).toBe(401);
    });

    it("rejects an unknown refresh token", async () => {
        const res = await post("/v1/auth/refresh", {
            refreshToken: `${crypto.randomUUID()}.not-a-real-secret`,
        });

        expect(res.status).toBe(401);

        const body = (await res.json()) as ErrorResponse;
        expect(body.message).toContain("invalid refresh token");
    });

    it("rejects a malformed refresh token", async () => {
        const res = await post("/v1/auth/refresh", {
            refreshToken: "not-a-valid-token-format",
        });

        expect(res.status).toBe(401);
    });

    it("rejects a missing refreshToken field", async () => {
        const res = await post("/v1/auth/refresh", {});

        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.status).toBeLessThan(500);
    });

    it("rejects refresh for an inactive user", async () => {
        const email = `refresh.inactive.${testEmail}`;

        const auth = await signup({ email });

        await db
            .update(users)
            .set({ isActive: false })
            .where(eq(users.email, email));

        const res = await post("/v1/auth/refresh", {
            refreshToken: auth.refreshToken,
        });

        expect(res.status).toBe(401);

        const body = (await res.json()) as ErrorResponse;
        expect(body.message).toContain("user account is inactive");
    });
});

describe("POST /v1/auth/logout", () => {
    it("revokes the refresh token", async () => {
        const auth = await signup();

        const res = await post("/v1/auth/logout", {
            refreshToken: auth.refreshToken,
        });

        expect(res.status).toBe(200);

        const body = (await res.json()) as SuccessResponse<{
            success: boolean;
        }>;

        expect(body.status).toBe("success");
        expect(body.data.success).toBe(true);

        const refreshAfterLogout = await post(
            "/v1/auth/refresh",
            { refreshToken: auth.refreshToken },
        );

        expect(refreshAfterLogout.status).toBe(401);
    });

    it("is safe to call twice with the same token", async () => {
        const auth = await signup();

        const first = await post("/v1/auth/logout", {
            refreshToken: auth.refreshToken,
        });

        expect(first.status).toBe(200);

        const second = await post("/v1/auth/logout", {
            refreshToken: auth.refreshToken,
        });

        expect(second.status).toBe(200);
    });

    it("returns success for a valid-looking but unknown refresh token", async () => {
        const res = await post("/v1/auth/logout", {
            refreshToken: `${crypto.randomUUID()}.not-a-real-secret`,
        });

        expect(res.status).toBe(200);
    });

    it("rejects a malformed refresh token", async () => {
        const res = await post("/v1/auth/logout", {
            refreshToken: "not-a-valid-token-format",
        });

        expect(res.status).toBe(401);
    });

    it("rejects a missing refreshToken field", async () => {
        const res = await post("/v1/auth/logout", {});

        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.status).toBeLessThan(500);
    });
});

describe("GET /v1/auth/me", () => {
    it("requires authentication", async () => {
        const res = await get("/v1/auth/me");

        expect(res.status).toBe(401);
    });

    it("returns the authenticated user", async () => {
        const auth = await signup();

        const res = await get(
            "/v1/auth/me",
            auth.accessToken,
        );

        expect(res.status).toBe(200);

        const body = (await res.json()) as SuccessResponse<User>;

        expect(body.status).toBe("success");
        expect(body.data.id).toBe(auth.user.id);
        expect(body.data.email).toBe(testEmail);
        expect(body.data.role).toBe(UserRoles.USER);
        expect(body.data.password).toBeUndefined();
    });

    it("rejects an inactive user", async () => {
        const email = `me.inactive.${testEmail}`;

        const auth = await signup({ email });

        await db
            .update(users)
            .set({ isActive: false })
            .where(eq(users.email, email));

        const res = await get(
            "/v1/auth/me",
            auth.accessToken,
        );

        expect(res.status).toBe(401);

        const body = (await res.json()) as ErrorResponse;
        expect(body.message).toContain("user account is inactive");
    });
});

describe("POST /v1/auth/logout-all", () => {
    it("revokes all refresh tokens for the authenticated user", async () => {
        const first = await signup();

        const secondSignin = await signinEmail();

        expect(secondSignin.status).toBe(200);

        const secondBody =
            (await secondSignin.json()) as SuccessResponse<AuthResponse>;

        const res = await post(
            "/v1/auth/logout-all",
            {},
            first.accessToken,
        );

        expect(res.status).toBe(200);

        const body = (await res.json()) as SuccessResponse<{
            success: boolean;
        }>;

        expect(body.status).toBe("success");
        expect(body.data.success).toBe(true);

        const firstRefresh = await post("/v1/auth/refresh", {
            refreshToken: first.refreshToken,
        });

        const secondRefresh = await post("/v1/auth/refresh", {
            refreshToken: secondBody.data.refreshToken,
        });

        expect(firstRefresh.status).toBe(401);
        expect(secondRefresh.status).toBe(401);
    });

    it("requires authentication", async () => {
        const res = await post("/v1/auth/logout-all", {});

        expect(res.status).toBe(401);
    });
});

describe("Auth route validation", () => {
    it("returns 404 for an unknown auth endpoint", async () => {
        const res = await post("/v1/auth/unknown", {});

        expect(res.status).toBe(404);
    });

    it("returns 404 for GET /v1/auth/signup", async () => {
        const res = await app.handle(
            new Request("http://localhost/v1/auth/signup", {
                method: "GET",
            }),
        );

        expect(res.status).toBe(404);
    });
});