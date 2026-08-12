import { Elysia } from "elysia";
import { env } from "./config/env";
import { info, logger } from "@rasla/logify";


const app = new Elysia().use(logger()).get("/", () => "ok").listen(env.appConf.port);

info(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`)