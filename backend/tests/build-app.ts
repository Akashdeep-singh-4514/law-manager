import { Elysia } from "elysia";
import { mainRouter } from "../src/router";
import { responseMiddleware } from "../src/utils/middleware";

/**
 * Builds an Elysia app instance for tests.
 * Does NOT call .listen() — use app.handle(request) to invoke routes directly,
 * no network socket needed.
 *
 * Assumes the test process already points at a test database
 * (e.g. DATABASE_URL env var) and that migrations have already been run
 * against it. This helper does not run migrations/seeders — keep those
 * out of per-test-file setup, run them once for the test DB instead.
 */
export function buildTestApp() {
    return new Elysia()
        .use(responseMiddleware)
        .use(mainRouter);
}
