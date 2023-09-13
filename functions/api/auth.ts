import { Hono } from "hono";
import { Bindings } from "./[[route]]";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/d1";
import { users } from "../../db/schema";

const route = new Hono<{ Bindings: Bindings }>();
const SALT_MAGNITUDE = 10;

const refinePassword = (value: string, ctx: z.RefinementCtx) => {
  if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "password must contain at least 1 letter and 1 number",
    });
    return;
  }
};

export const authRouter = route.post(
  "/register",
  zValidator(
    "form",
    z.object({
      email: z.string().email(),
      password: z
        .string()
        .min(8, { message: "password must be at least 8 characters" })
        .max(128, { message: "password must be at most 128 characters" })
        .superRefine(refinePassword),
    })
  ),
  async (c) => {
    const passwordHash = await bcrypt.hash(
      c.req.valid("form").password,
      SALT_MAGNITUDE
    );

    const db = drizzle(c.env.SHARED_STORAGE_DB);

    try {
      const user = await db
        .insert(users)
        .values({ email: c.req.valid("form").email, passwordHash })
        .returning();

      return c.jsonT(user);
    } catch (error) {
      return c.text("Invalid Username or Password!", 400);
    }
  }
);
