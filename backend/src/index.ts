import { Elysia } from "elysia";
import { env } from "./config/env";
import { info, logger } from "@rasla/logify";
import { mainRouter } from "./router";

const app = new Elysia()
  .use(logger())
  .onRequest(({ request }) => {
    console.log("REQUEST URL:", JSON.stringify(request.url));
  }) // dont remove logger will throw error on request
  .use(mainRouter)
  .get("/", () => "ok")
  .listen(env.appConf.port);

info(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`)