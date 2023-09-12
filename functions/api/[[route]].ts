import { Hono } from "hono";
import { handle } from "hono/cloudflare-pages";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { todos as todosTable } from "../../db/schema";
import { drizzle } from "drizzle-orm/d1";
import { logger } from "hono/logger";
import { eq } from "drizzle-orm";

type Bindings = {
  SHARED_STORAGE_DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", logger());

const route = app
  .basePath("/api")
  .post(
    "/todo",
    zValidator("form", z.object({ message: z.string() })),
    async (c) => {
      const todo = c.req.valid("form");
      const db = drizzle(c.env.SHARED_STORAGE_DB);

      await db.insert(todosTable).values({ message: todo.message });
      return c.jsonT({ message: "created!" });
    }
  )
  .get(async (c) => {
    const db = drizzle(c.env.SHARED_STORAGE_DB);
    const todos = await db.select().from(todosTable).all();

    return c.jsonT({ todos });
  })
  .patch(
    "/todo/:id/status",
    zValidator(
      "form",
      z.object({
        status: z.string().pipe(z.coerce.number()),
      })
    ),
    zValidator(
      "param",
      z.object({
        id: z.string().pipe(z.coerce.number()),
      })
    ),
    async (c) => {
      const form = c.req.valid("form");
      const id = c.req.valid("param").id;
      const db = drizzle(c.env.SHARED_STORAGE_DB);

      const updated = await db
        .update(todosTable)
        .set({ status: form.status === 1 })
        .where(eq(todosTable.id, id))
        .returning();

      return c.jsonT(updated);
    }
  );

export type AppType = typeof route;

export const onRequest = handle(app);
