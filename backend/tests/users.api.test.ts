import { describe, it, expect, beforeAll, afterAll, afterEach } from "bun:test";
import { eq } from "drizzle-orm";
import { buildTestApp } from "./build-app";
import { connectDatabase, closeDatabase, db } from "../src/db";
import { users } from "../src/modules/users/users.schema";

/**
 * IMPORTANT: these tests hit a real database through the real repository.
 * Point DATABASE_URL (however your db module reads config) at a dedicated
 * test database before running this file — never point it at dev/prod data.
 * Migrations must already be applied to that test database.
 */

const app = buildTestApp();

// Unique per test run so re-runs / parallel runs don't collide on the
// (dialCode, mobile) or email unique constraints.
const runId = Date.now();
const testEmail = `test.user.${runId}@example.com`;
const testDialCode = "+91";
const testMobile = `9${String(runId).slice(-9)}`;

async function post(path: string, body: unknown) {
    return app.handle(
        new Request(`http://localhost${path}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        })
    );
}

async function get(path: string) {
    return app.handle(new Request(`http://localhost${path}`));
}

beforeAll(async () => {
    await connectDatabase();
});

afterAll(async () => {
    await closeDatabase();
});

// Belt-and-suspenders cleanup: delete anything this file created, even if
// an assertion fails mid-test.
afterEach(async () => {
    await db.delete(users).where(eq(users.email, testEmail));
});

describe("POST /v1/users", () => {
    it("returns 422 with a field-level message for an invalid email", async () => {
        const res = await post("/v1/users", {
            name: "Jane Doe",
            email: "not-an-email",
            password: "password123",
            dialCode: testDialCode,
            mobile: testMobile,
        });

        expect(res.status).toBe(422);
        const body = await res.json();
        expect(JSON.stringify(body)).toContain("valid email");
    });

    it("creates a user and returns it without the password field", async () => {
        const res = await post("/v1/users", {
            name: "Jane Doe",
            email: testEmail,
            password: "password123",
            dialCode: testDialCode,
            mobile: testMobile,
        });

        expect(res.status).toBe(200);
        const body = await res.json();

        expect(body.status).toBe("success");
        expect(body.data.email).toBe(testEmail);
        expect(body.data.password).toBeUndefined();
    });

    it("rejects a duplicate email with 409", async () => {
        // first insert
        await post("/v1/users", {
            name: "Jane Doe",
            email: testEmail,
            password: "password123",
            dialCode: testDialCode,
            mobile: testMobile,
        });

        // second insert, same email, different mobile
        const res = await post("/v1/users", {
            name: "Jane Doe Again",
            email: testEmail,
            password: "password123",
            dialCode: testDialCode,
            mobile: `9${String(runId + 1).slice(-9)}`,
        });

        expect(res.status).toBe(409);
        const body = await res.json();
        expect(body.message).toContain("email already exists");
    });

    it("rejects a duplicate dialCode+mobile combination with 409", async () => {
        await post("/v1/users", {
            name: "Jane Doe",
            email: testEmail,
            password: "password123",
            dialCode: testDialCode,
            mobile: testMobile,
        });

        const res = await post("/v1/users", {
            name: "Someone Else",
            email: `other.${testEmail}`,
            password: "password123",
            dialCode: testDialCode,
            mobile: testMobile,
        });
        expect(res.status).toBe(409);
        const body = await res.json();
        expect(body.message).toContain("mobile number already exists");

        // extra cleanup since this test used a second email
        await db.delete(users).where(eq(users.email, `other.${testEmail}`));
    });
});

describe("GET /v1/users/:id", () => {
    it("returns 404 for a non-existent id", async () => {
        const res = await get("/v1/users/999999999");
        expect(res.status).toBe(404);
    });

    it("returns the created user by id", async () => {
        const createRes = await post("/v1/users", {
            name: "Jane Doe",
            email: testEmail,
            password: "password123",
            dialCode: testDialCode,
            mobile: testMobile,
        });
        const created = await createRes.json();

        const res = await get(`/v1/users/${created.data.id}`);
        expect(res.status).toBe(200);

        const body = await res.json();
        expect(body.data.email).toBe(testEmail);
    });
});
