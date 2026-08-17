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


const app = buildTestApp();


const runId = Date.now();

const testEmail =
    `test.user.${runId}@example.com`;

const testDialCode = "+91";

const testMobile =
    `9${String(runId).slice(-9)}`;

async function post(
    path: string,
    body: unknown
) {
    return app.handle(
        new Request(`http://localhost${path}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        })
    );
}


async function get(path: string) {
    return app.handle(
        new Request(`http://localhost${path}`)
    );
}


async function patch(
    path: string,
    body: unknown
) {
    return app.handle(
        new Request(`http://localhost${path}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        })
    );
}



beforeAll(async () => {
    await connectDatabase();
});


afterAll(async () => {
    await closeDatabase();
});


afterEach(async () => {
    /*
     * Remove anything created by the test run.
     *
     * We use email patterns because some PATCH tests change
     * the user's email.
     */

    await db
        .delete(users)
        .where(eq(users.email, testEmail));

    await db
        .delete(users)
        .where(eq(users.email, `updated.${testEmail}`));

    await db
        .delete(users)
        .where(eq(users.email, `multi.${testEmail}`));

    await db
        .delete(users)
        .where(eq(users.email, `other.${testEmail}`));

    await db
        .delete(users)
        .where(eq(users.email, `other.mobile.${testEmail}`));

    await db
        .delete(users)
        .where(eq(users.email, `second.${testEmail}`));
});


async function createTestUser() {
    const res = await post("/v1/users", {
        name: "Jane Doe",
        email: testEmail,
        password: "password123",
        dialCode: testDialCode,
        mobile: testMobile,
    });

    expect(res.status).toBe(200);

    const body = await res.json();

    return body.data;
}


describe("POST /v1/users", () => {

    it("returns 422 for an invalid email", async () => {
        const res = await post("/v1/users", {
            name: "Jane Doe",
            email: "not-an-email",
            password: "password123",
            dialCode: testDialCode,
            mobile: testMobile,
        });

        expect(res.status).toBe(422);

        const body = await res.json();

        expect(
            JSON.stringify(body)
        ).toContain("valid email");
    });


    it("creates a user successfully", async () => {
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

        expect(body.data.id).toBeDefined();

        expect(body.data.name)
            .toBe("Jane Doe");

        expect(body.data.email)
            .toBe(testEmail);

        expect(body.data.dialCode)
            .toBe(testDialCode);

        expect(body.data.mobile)
            .toBe(testMobile);

        expect(body.data.password)
            .toBeUndefined();
    });


    it("rejects duplicate email with 409", async () => {
        await post("/v1/users", {
            name: "Jane Doe",
            email: testEmail,
            password: "password123",
            dialCode: testDialCode,
            mobile: testMobile,
        });


        const res = await post("/v1/users", {
            name: "Jane Doe Again",
            email: testEmail,
            password: "password123",
            dialCode: testDialCode,
            mobile: `8${String(runId).slice(-9)}`,
        });


        expect(res.status).toBe(409);

        const body = await res.json();

        expect(body.message)
            .toContain("email already exists");
    });


    it("rejects duplicate dialCode + mobile with 409", async () => {
        await post("/v1/users", {
            name: "Jane Doe",
            email: testEmail,
            password: "password123",
            dialCode: testDialCode,
            mobile: testMobile,
        });


        const otherEmail =
            `other.${testEmail}`;


        const res = await post("/v1/users", {
            name: "Someone Else",
            email: otherEmail,
            password: "password123",
            dialCode: testDialCode,
            mobile: testMobile,
        });


        expect(res.status).toBe(409);

        const body = await res.json();

        expect(body.message)
            .toContain(
                "mobile number already exists"
            );


        await db
            .delete(users)
            .where(eq(users.email, otherEmail));
    });


    it("creates a user with optional fields", async () => {
        const res = await post("/v1/users", {
            name: "Jane Doe",
            email: testEmail,
            password: "password123",
            dialCode: testDialCode,
            mobile: testMobile,
            isActive: true,
            devices: [
                "device-1",
                "device-2",
            ],
        });


        expect(res.status).toBe(200);

        const body = await res.json();

        expect(body.data.isActive)
            .toBe(true);

        expect(body.data.devices)
            .toEqual([
                "device-1",
                "device-2",
            ]);
    });
});


describe("GET /v1/users", () => {

    it("returns users successfully", async () => {
        const res = await get("/v1/users");

        expect(res.status).toBe(200);

        const body = await res.json();

        expect(body.status)
            .toBe("success");

        expect(Array.isArray(body.data))
            .toBe(true);
    });


    it("returns the created user", async () => {
        await createTestUser();

        const res = await get("/v1/users");

        expect(res.status).toBe(200);

        const body = await res.json();

        const user = body.data.find(
            (item: { email: string }) =>
                item.email === testEmail
        );

        expect(user).toBeDefined();

        expect(user.email)
            .toBe(testEmail);

        expect(user.password)
            .toBeUndefined();
    });
});



describe("GET /v1/users/:id", () => {

    it("returns 404 for a non-existent user", async () => {
        const res =
            await get("/v1/users/999999999");

        expect(res.status).toBe(404);
    });


    it("returns the user by id", async () => {
        const user =
            await createTestUser();


        const res =
            await get(`/v1/users/${user.id}`);


        expect(res.status).toBe(200);

        const body = await res.json();

        expect(body.status)
            .toBe("success");

        expect(body.data.id)
            .toBe(user.id);

        expect(body.data.name)
            .toBe("Jane Doe");

        expect(body.data.email)
            .toBe(testEmail);

        expect(body.data.password)
            .toBeUndefined();
    });
});




describe("PATCH /v1/users/:id", () => {

    it("updates the user's name", async () => {
        const user =
            await createTestUser();


        const res = await patch(
            `/v1/users/${user.id}`,
            {
                name: "Jane Updated",
            }
        );

        expect(res.status).toBe(200);

        const body = await res.json();

        expect(body.status)
            .toBe("success");

        expect(body.data.id)
            .toBe(user.id);

        expect(body.data.name)
            .toBe("Jane Updated");

        expect(body.data.email)
            .toBe(testEmail);

        expect(body.data.password)
            .toBeUndefined();
    });


    it("updates the user's email", async () => {
        const user =
            await createTestUser();

        const newEmail =
            `updated.${testEmail}`;


        const res = await patch(
            `/v1/users/${user.id}`,
            {
                email: newEmail,
            }
        );


        expect(res.status).toBe(200);

        const body = await res.json();

        expect(body.data.email)
            .toBe(newEmail);
    });


    it("updates the user's mobile", async () => {
        const user =
            await createTestUser();

        const newMobile =
            `8${String(runId).slice(-9)}`;


        const res = await patch(
            `/v1/users/${user.id}`,
            {
                mobile: newMobile,
            }
        );


        expect(res.status).toBe(200);

        const body = await res.json();

        expect(body.data.mobile)
            .toBe(newMobile);
    });


    it("updates dial code and mobile", async () => {
        const user =
            await createTestUser();


        const res = await patch(
            `/v1/users/${user.id}`,
            {
                dialCode: "+1",
                mobile: "9876543210",
            }
        );


        expect(res.status).toBe(200);

        const body = await res.json();

        expect(body.data.dialCode)
            .toBe("+1");

        expect(body.data.mobile)
            .toBe("9876543210");
    });


    it("updates isActive", async () => {
        const user =
            await createTestUser();


        const res = await patch(
            `/v1/users/${user.id}`,
            {
                isActive: false,
            }
        );


        expect(res.status).toBe(200);

        const body = await res.json();

        expect(body.data.isActive)
            .toBe(false);
    });



    it("updates multiple fields", async () => {
        const user =
            await createTestUser();

        const newEmail =
            `multi.${testEmail}`;


        const res = await patch(
            `/v1/users/${user.id}`,
            {
                name: "Updated Name",
                email: newEmail,
                isActive: false,
            }
        );


        expect(res.status).toBe(200);

        const body = await res.json();

        expect(body.data.id)
            .toBe(user.id);

        expect(body.data.name)
            .toBe("Updated Name");

        expect(body.data.email)
            .toBe(newEmail);

        expect(body.data.isActive)
            .toBe(false);

        expect(body.data.password)
            .toBeUndefined();
    });



    it("returns 404 when updating non-existent user", async () => {
        const res = await patch(
            "/v1/users/999999999",
            {
                name: "Does Not Exist",
            }
        );


        expect(res.status).toBe(404);
    });


    it("rejects invalid email", async () => {
        const user =
            await createTestUser();


        const res = await patch(
            `/v1/users/${user.id}`,
            {
                email: "invalid-email",
            }
        );


        expect(res.status).toBe(422);

        const body = await res.json();

        expect(
            JSON.stringify(body)
        ).toContain("valid email");
    });


    it("rejects duplicate email", async () => {
        const user =
            await createTestUser();


        const otherEmail =
            `other.${testEmail}`;


        await post("/v1/users", {
            name: "Other User",
            email: otherEmail,
            password: "password123",
            dialCode: "+91",
            mobile: `8${String(runId).slice(-9)}`,
        });


        const res = await patch(
            `/v1/users/${user.id}`,
            {
                email: otherEmail,
            }
        );


        expect(res.status).toBe(409);

        const body = await res.json();

        expect(body.message)
            .toContain(
                "email already exists"
            );


        await db
            .delete(users)
            .where(eq(users.email, otherEmail));
    });


    it("rejects duplicate dialCode + mobile", async () => {
        const user =
            await createTestUser();


        const otherEmail =
            `other.mobile.${testEmail}`;

        const otherMobile =
            `8${String(runId + 1).slice(-9)}`;


        await post("/v1/users", {
            name: "Other User",
            email: otherEmail,
            password: "password123",
            dialCode: "+91",
            mobile: otherMobile,
        });


        const res = await patch(
            `/v1/users/${user.id}`,
            {
                mobile: otherMobile,
            }
        );


        expect(res.status).toBe(409);

        const body = await res.json();

        expect(body.message)
            .toContain(
                "mobile number already exists"
            );


        await db
            .delete(users)
            .where(eq(users.email, otherEmail));
    });


    it("updates only the requested user", async () => {
        const firstUser =
            await createTestUser();


        const secondEmail =
            `second.${testEmail}`;


        const secondRes = await post(
            "/v1/users",
            {
                name: "Second User",
                email: secondEmail,
                password: "password123",
                dialCode: "+91",
                mobile:
                    `7${String(runId).slice(-9)}`,
            }
        );


        expect(secondRes.status)
            .toBe(200);


        const secondUser =
            (await secondRes.json()).data;


        const res = await patch(
            `/v1/users/${firstUser.id}`,
            {
                name: "Only First Updated",
            }
        );


        expect(res.status)
            .toBe(200);


        const firstGet =
            await get(
                `/v1/users/${firstUser.id}`
            );


        const secondGet =
            await get(
                `/v1/users/${secondUser.id}`
            );


        const firstBody =
            await firstGet.json();

        const secondBody =
            await secondGet.json();


        expect(firstBody.data.name)
            .toBe("Only First Updated");


        expect(secondBody.data.name)
            .toBe("Second User");


        await db
            .delete(users)
            .where(
                eq(users.email, secondEmail)
            );
    });
});