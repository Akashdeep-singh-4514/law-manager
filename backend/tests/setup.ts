import {
    beforeAll,
    afterAll,
} from "bun:test";

import {
    connectDatabase,
    closeDatabase,
} from "../src/db";

beforeAll(async () => {
    await connectDatabase();
});

afterAll(async () => {
    await closeDatabase();
});
