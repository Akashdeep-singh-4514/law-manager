import {
    describe,
    it,
    expect,
    afterEach,
} from "bun:test";

import { eq } from "drizzle-orm";

import { buildTestApp } from "./build-app";
import { db } from "../src/db";
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

const app = buildTestApp();
const runId = Date.now();

const testEmail = `users.test.${runId}@example.com`;
const testDialCode = "+91";
const testMobile = `9${String(runId).slice(-9)}`;
const testPassword = "password123";

async function request(
    path: string,
    init: RequestInit = {},
): Promise<Response> {
    return app.handle(
        new Request(`http://localhost${path}`, init),
    );
}

async function post(
    path: string,
    body: Record<string, unknown>,
    accessToken?: string,
): Promise<Response> {
    return request(path, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(accessToken
                ? {
                      Authorization: `Bearer ${accessToken}`,
                  }
                : {}),
        },
        body: JSON.stringify(body),
    });
}

async function get(
    path: string,
    accessToken?: string,
): Promise<Response> {
    return request(path, {
        method: "GET",
        headers: accessToken
            ? {
                  Authorization: `Bearer ${accessToken}`,
              }
            : undefined,
    });
}

async function patch(
    path: string,
    body: Record<string, unknown>,
    accessToken?: string,
): Promise<Response> {
    return request(path, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            ...(accessToken
                ? {
                      Authorization: `Bearer ${accessToken}`,
                  }
                : {}),
        },
        body: JSON.stringify(body),
    });
}

async function del(
    path: string,
    accessToken?: string,
): Promise<Response> {
    return request(path, {
        method: "DELETE",
        headers: accessToken
            ? {
                  Authorization: `Bearer ${accessToken}`,
              }
            : undefined,
    });
}

async function signup(
    overrides: Record<string, unknown> = {},
): Promise<AuthResponse> {
    const res = await post("/v1/auth/signup", {
        name: "Jane Doe",
        email: testEmail,
        password: testPassword,
        dialCode: testDialCode,
        mobile: testMobile,
        ...overrides,
    });

    expect(res.status).toBe(200);

    const body = (await res.json()) as SuccessResponse<AuthResponse>;

    if (body.status !== "success") {
        throw new Error(
            `Failed to signup test user: ${body.message}`,
        );
    }

    return body.data;
}

async function createUser(
    overrides: Record<string, unknown> = {},
): Promise<AuthResponse> {
    return signup(overrides);
}

async function cleanupByEmails(...emails: string[]) {
    for (const email of emails) {
        await db
            .delete(users)
            .where(eq(users.email, email));
    }
}

afterEach(async () => {
    await cleanupByEmails(
        testEmail,
        `updated.${testEmail}`,
        `second.${testEmail}`,
        `other.${testEmail}`,
        `role.${testEmail}`,
        `admin.${testEmail}`,
        `password.${testEmail}`,
    );
});

describe("POST /v1/users", () => {
    it("is not exposed because user creation is handled by auth signup", async () => {
        const res = await post("/v1/users", {
            name: "Should Not Be Created",
            email: testEmail,
            password: testPassword,
            dialCode: testDialCode,
            mobile: testMobile,
        });

        expect(res.status).toBe(404);
    });
});


describe("GET /v1/users", () => {
    it("returns users successfully", async () => {
        const res = await get("/v1/users");

        expect(res.status).toBe(200);

        const body = (await res.json()) as SuccessResponse<User[]>;

        expect(body.status).toBe("success");
        expect(Array.isArray(body.data)).toBe(true);

        for (const user of body.data) {
            expect(user.password).toBeUndefined();
            expect(user.role).toBeDefined();
        }
    });

    it("returns the created user without password", async () => {
        const auth = await createUser();

        const res = await get(
            "/v1/users",
            auth.accessToken,
        );

        expect(res.status).toBe(200);

        const body = (await res.json()) as SuccessResponse<User[]>;

        const user = body.data.find(
            (item) => item.email === testEmail,
        );

        expect(user).toBeDefined();
        expect(user?.name).toBe("Jane Doe");
        expect(user?.email).toBe(testEmail);
        expect(user?.role).toBe(UserRoles.USER);
        expect(user?.password).toBeUndefined();
    });
});


describe("GET /v1/users/:id", () => {
    it("requires authentication", async () => {
        const auth = await createUser();

        const res = await get(
            `/v1/users/${auth.user.id}`,
        );

        expect(res.status).toBe(401);
    });

    it("returns the authenticated user's profile", async () => {
        const auth = await createUser();

        const res = await get(
            `/v1/users/${auth.user.id}`,
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

    it("does not allow a user to access another user's profile", async () => {
        const first = await createUser();

        const second = await signup({
            email: `second.${testEmail}`,
            mobile: `8${String(runId).slice(-9)}`,
        });

        const res = await get(
            `/v1/users/${second.user.id}`,
            first.accessToken,
        );

        expect(res.status).toBe(403);
    });

    it("returns 403 for a non-existent user because self middleware runs first", async () => {
        const auth = await createUser();

        const res = await get(
            "/v1/users/999999999",
            auth.accessToken,
        );

        expect(res.status).toBe(403);
    });

    it("returns 400 for a non-numeric id", async () => {
        const auth = await createUser();

        const res = await get(
            "/v1/users/not-a-number",
            auth.accessToken,
        );

        expect(res.status).toBe(400);
    });
});

describe("PATCH /v1/users/:id", () => {
    it("requires authentication", async () => {
        const auth = await createUser();

        const res = await patch(
            `/v1/users/${auth.user.id}`,
            { name: "Updated" },
        );

        expect(res.status).toBe(401);
    });

    it("updates the authenticated user's name", async () => {
        const auth = await createUser();

        const res = await patch(
            `/v1/users/${auth.user.id}`,
            { name: "Jane Updated" },
            auth.accessToken,
        );

        expect(res.status).toBe(200);

        const body = (await res.json()) as SuccessResponse<User>;

        expect(body.data.id).toBe(auth.user.id);
        expect(body.data.name).toBe("Jane Updated");
        expect(body.data.password).toBeUndefined();
    });

    it("updates the authenticated user's email", async () => {
        const auth = await createUser();

        const newEmail = `updated.${testEmail}`;

        const res = await patch(
            `/v1/users/${auth.user.id}`,
            { email: newEmail },
            auth.accessToken,
        );

        expect(res.status).toBe(200);

        const body = (await res.json()) as SuccessResponse<User>;

        expect(body.data.email).toBe(newEmail);
    });

    it("updates mobile and dial code", async () => {
        const auth = await createUser();

        const newMobile = `8${String(runId).slice(-9)}`;

        const res = await patch(
            `/v1/users/${auth.user.id}`,
            {
                dialCode: "+1",
                mobile: newMobile,
            },
            auth.accessToken,
        );

        expect(res.status).toBe(200);

        const body = (await res.json()) as SuccessResponse<User>;

        expect(body.data.dialCode).toBe("+1");
        expect(body.data.mobile).toBe(newMobile);
    });

    it("updates isActive", async () => {
        const auth = await createUser();

        const res = await patch(
            `/v1/users/${auth.user.id}`,
            { isActive: false },
            auth.accessToken,
        );

        expect(res.status).toBe(200);

        const body = (await res.json()) as SuccessResponse<User>;

        expect(body.data.isActive).toBe(false);
    });

    it("rejects an empty update", async () => {
        const auth = await createUser();

        const res = await patch(
            `/v1/users/${auth.user.id}`,
            {},
            auth.accessToken,
        );

        expect(res.status).toBe(400);
    });

    it("rejects password changes through the general update endpoint", async () => {
        const auth = await createUser();

        const res = await patch(
            `/v1/users/${auth.user.id}`,
            { password: "newPassword123" },
            auth.accessToken,
        );

        expect(res.status).toBe(400);
    });

    it("does not allow changing another user's profile", async () => {
        const first = await createUser();

        const second = await signup({
            email: `second.${testEmail}`,
            mobile: `8${String(runId).slice(-9)}`,
        });

        const res = await patch(
            `/v1/users/${second.user.id}`,
            { name: "Should Not Change" },
            first.accessToken,
        );

        expect(res.status).toBe(403);
    });

    it("rejects a duplicate email", async () => {
        const first = await createUser();

        const second = await signup({
            email: `second.${testEmail}`,
            mobile: `8${String(runId).slice(-9)}`,
        });

        const res = await patch(
            `/v1/users/${second.user.id}`,
            { email: first.user.email },
            second.accessToken,
        );

        expect(res.status).toBe(409);

        const body = (await res.json()) as ErrorResponse;

        expect(body.message).toContain(
            "email already exists",
        );
    });

    it("rejects a duplicate dialCode + mobile", async () => {
        const first = await createUser();

        const second = await signup({
            email: `second.${testEmail}`,
            mobile: `8${String(runId).slice(-9)}`,
        });

        const res = await patch(
            `/v1/users/${second.user.id}`,
            {
                dialCode: first.user.dialCode,
                mobile: first.user.mobile,
            },
            second.accessToken,
        );

        expect(res.status).toBe(409);

        const body = (await res.json()) as ErrorResponse;

        expect(body.message).toContain(
            "mobile number already exists",
        );
    });

    it("returns 403 for a non-existent user because self middleware runs first", async () => {
        const auth = await createUser();

        const res = await patch(
            "/v1/users/999999999",
            { name: "Missing" },
            auth.accessToken,
        );

        expect(res.status).toBe(403);
    });

    it("returns 400 for a non-numeric id", async () => {
        const auth = await createUser();

        const res = await patch(
            "/v1/users/not-a-number",
            { name: "Invalid ID" },
            auth.accessToken,
        );

        expect(res.status).toBe(400);
    });
});


describe("PATCH /v1/users/:id/password", () => {
    it("requires authentication", async () => {
        const auth = await createUser({
            email: `password.${testEmail}`,
        });

        const res = await patch(
            `/v1/users/${auth.user.id}/password`,
            { password: "newPassword123" },
        );

        expect(res.status).toBe(401);
    });

    it("updates the password through the dedicated endpoint", async () => {
        const auth = await createUser({
            email: `password.${testEmail}`,
        });

        const res = await patch(
            `/v1/users/${auth.user.id}/password`,
            { password: "newPassword123" },
            auth.accessToken,
        );

        expect(res.status).toBe(200);

        const body = (await res.json()) as SuccessResponse<User>;

        expect(body.data.id).toBe(auth.user.id);
        expect(body.data.password).toBeUndefined();

        const login = await post("/v1/auth/signin/email", {
            email: `password.${testEmail}`,
            password: "newPassword123",
        });

        expect(login.status).toBe(200);
    });

    it("does not allow changing another user's password", async () => {
        const first = await createUser();

        const second = await signup({
            email: `password.${testEmail}`,
            mobile: `8${String(runId).slice(-9)}`,
        });

        const res = await patch(
            `/v1/users/${second.user.id}/password`,
            { password: "newPassword123" },
            first.accessToken,
        );

        expect(res.status).toBe(403);
    });

    it("returns 403 for a non-existent user because self middleware runs first", async () => {
        const auth = await createUser();

        const res = await patch(
            "/v1/users/999999999/password",
            { password: "newPassword123" },
            auth.accessToken,
        );

        expect(res.status).toBe(403);
    });

    it("returns 400 for a non-numeric id", async () => {
        const auth = await createUser();

        const res = await patch(
            "/v1/users/not-a-number/password",
            { password: "newPassword123" },
            auth.accessToken,
        );

        expect(res.status).toBe(400);
    });
});


describe("DELETE /v1/users/:id", () => {
    it("requires authentication", async () => {
        const auth = await createUser();

        const res = await del(
            `/v1/users/${auth.user.id}`,
        );

        expect(res.status).toBe(401);
    });

    it("deletes the authenticated user successfully", async () => {
        const auth = await createUser();

        const res = await del(
            `/v1/users/${auth.user.id}`,
            auth.accessToken,
        );

        expect(res.status).toBe(200);

        const body = (await res.json()) as SuccessResponse<unknown>;

        expect(body.status).toBe("success");

        const getRes = await get(
            `/v1/users/${auth.user.id}`,
            auth.accessToken,
        );

        expect(getRes.status).toBe(404);
    });

    it("does not allow deleting another user", async () => {
        const first = await createUser();

        const second = await signup({
            email: `second.${testEmail}`,
            mobile: `8${String(runId).slice(-9)}`,
        });

        const res = await del(
            `/v1/users/${second.user.id}`,
            first.accessToken,
        );

        expect(res.status).toBe(403);

        const secondGet = await get(
            `/v1/users/${second.user.id}`,
            second.accessToken,
        );

        expect(secondGet.status).toBe(200);
    });

    it("returns 403 when deleting a non-existent user because self middleware runs first", async () => {
        const auth = await createUser();

        const res = await del(
            "/v1/users/999999999",
            auth.accessToken,
        );

        expect(res.status).toBe(403);
    });

    it("returns 400 for a non-numeric id", async () => {
        const auth = await createUser();

        const res = await del(
            "/v1/users/not-a-number",
            auth.accessToken,
        );

        expect(res.status).toBe(400);
    });

    it("returns 404 when deleting the same user twice", async () => {
        const auth = await createUser();

        const first = await del(
            `/v1/users/${auth.user.id}`,
            auth.accessToken,
        );

        expect(first.status).toBe(200);

        const second = await del(
            `/v1/users/${auth.user.id}`,
            auth.accessToken,
        );

        expect(second.status).toBe(404);
    });
});

describe("POST /v1/users/create-admin", () => {
    it("creates an admin user", async () => {
        const email = `admin.${testEmail}`;

        const res = await post("/v1/users/create-admin", {
            name: "Admin User",
            email,
            password: testPassword,
            dialCode: "+91",
            mobile: `8${String(runId).slice(-9)}`,
        });

        expect(res.status).toBe(200);

        const body = (await res.json()) as SuccessResponse<User>;

        expect(body.status).toBe("success");
        expect(body.data.email).toBe(email);
        expect(body.data.role).toBe(UserRoles.ADMIN);
        expect(body.data.password).toBeUndefined();
    });
});


describe("PATCH /v1/users/:id role", () => {
    it("changes a user's role through the admin endpoint", async () => {
        const auth = await createUser();

        const res = await patch(
            `/v1/users/${auth.user.id}/role`,
            { role: UserRoles.ADMIN },
            auth.accessToken,
        );

        expect(res.status).toBe(200);

        const body = (await res.json()) as SuccessResponse<User>;

        expect(body.data.role).toBe(UserRoles.ADMIN);
    });
});