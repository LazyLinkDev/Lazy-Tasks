import { Hono } from "hono";
import { handle } from "hono/cloudflare-pages";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { todos as todosTable } from "../../db/schema";
import { drizzle } from "drizzle-orm/d1";

type Bindings = {
  SHARED_STORAGE_DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

const schema = z.object({
  id: z.string(),
  title: z.string(),
});

const route = app
  .basePath("/api")
  .post("/todo", zValidator("form", schema), async (c) => {
    const todo = c.req.valid("form");
    const db = drizzle(c.env.SHARED_STORAGE_DB);

    await db.insert(todosTable).values({
      message: todo.title,
    });
    return c.jsonT({ message: "created!" });
  })
  .get(async (c) => {
    const db = drizzle(c.env.SHARED_STORAGE_DB);
    const todos = await db.select().from(todosTable).all();

    return c.jsonT({ todos });
  });

export type AppType = typeof route;

export const onRequest = handle(app);
