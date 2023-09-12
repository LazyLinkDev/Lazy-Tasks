import { Hono } from "hono";
import { handle } from "hono/cloudflare-pages";
import { logger } from "hono/logger";
import { todoRoute } from "./todo";

export type Bindings = {
  SHARED_STORAGE_DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", logger());

const route = app.basePath("/api").route("/todo", todoRoute);

export type AppType = typeof route;

export const onRequest = handle(app);
