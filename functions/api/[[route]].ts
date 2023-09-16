import { Hono } from "hono";
import { handle } from "hono/cloudflare-pages";
import { logger } from "hono/logger";
import { todoRoute } from "./todo";
import { authRouter } from "./auth";

export type Bindings = {
  SHARED_STORAGE_DB: D1Database;
  JWT_ACCESS_EXPIRATION_MINUTES: number;
  JWT_REFRESH_EXPIRATION_DAYS: number;
  JWT_RESET_PASSWORD_EXPIRATION_MINUTES: number;
  JWT_SECRET: string;
  RESEND_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", logger());

const route = app
  .basePath("/api")
  .route("/todo", todoRoute)
  .route("/auth", authRouter);

export type AppType = typeof route;

export const onRequest = handle(app);
