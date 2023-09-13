import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { z } from "zod";
import { todos as todosTable } from "../../db/schema";
import { Bindings } from "./[[route]]";

const route = new Hono<{ Bindings: Bindings }>();

export const todoRoute = route
  .get("", async (c) => {
    const db = drizzle(c.env.SHARED_STORAGE_DB);
    const todos = await db.select().from(todosTable).all();

    return c.jsonT({ todos });
  })
  .post(
    "",
    zValidator("form", z.object({ message: z.string() })),
    async (c) => {
      const todo = c.req.valid("form");
      const db = drizzle(c.env.SHARED_STORAGE_DB);

      await db.insert(todosTable).values({ message: todo.message });
      return c.jsonT({ message: "created!" });
    }
  )
  .patch(
    "/:id",
    zValidator(
      "form",
      z.object({
        status: z.string().pipe(z.coerce.number()),
        message: z.string(),
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
        .set({ status: form.status === 1, message: form.message })
        .where(eq(todosTable.id, id))
        .returning();

      return c.jsonT(updated);
    }
  )
  .delete(
    "/:id",
    zValidator("param", z.object({ id: z.string().pipe(z.coerce.number()) })),
    async (c) => {
      const id = c.req.valid("param").id;
      const db = drizzle(c.env.SHARED_STORAGE_DB);

      await db.delete(todosTable).where(eq(todosTable.id, id));

      c.status(201);

      return c.text("");
    }
  );
