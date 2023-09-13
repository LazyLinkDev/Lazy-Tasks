import { zValidator } from "@hono/zod-validator";
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { z } from "zod";
import { users } from "../../db/schema";
import { generateUserTokens } from "../token";
import { Bindings } from "./[[route]]";
import { eq } from "drizzle-orm";

const route = new Hono<{ Bindings: Bindings }>();
const SALT_MAGNITUDE = 10;
const USER_ERROR_MESSAGE = "Invalid Username or Password!";

const refinePassword = (value: string, ctx: z.RefinementCtx) => {
  if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "password must contain at least 1 letter and 1 number",
    });
    return;
  }
};

export const authRouter = route
  .post(
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
        const user = (
          await db
            .insert(users)
            .values({ email: c.req.valid("form").email, passwordHash })
            .returning()
        )[0];

        const tokens = await generateUserTokens(user, {
          accessExpirationMinutes: c.env.JWT_ACCESS_EXPIRATION_MINUTES,
          refreshExpirationDays: c.env.JWT_REFRESH_EXPIRATION_DAYS,
          secret: c.env.JWT_SECRET,
        });

        return c.jsonT({
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            isEmailVerified: user.isEmailVerified,
          },
          tokens,
        });
      } catch (error) {
        return c.text(USER_ERROR_MESSAGE, 400);
      }
    }
  )
  .post(
    "/login",
    zValidator(
      "form",
      z.object({ email: z.string().email(), password: z.string() })
    ),
    async (c) => {
      const db = drizzle(c.env.SHARED_STORAGE_DB);

      try {
        const user = (
          await db
            .select()
            .from(users)
            .where(eq(users.email, c.req.valid("form").email))
        )[0];

        if (
          !user ||
          !(await bcrypt.compare(
            c.req.valid("form").password,
            user.passwordHash
          ))
        ) {
          return c.text(USER_ERROR_MESSAGE, 400);
        }

        const tokens = await generateUserTokens(user, {
          accessExpirationMinutes: c.env.JWT_ACCESS_EXPIRATION_MINUTES,
          refreshExpirationDays: c.env.JWT_REFRESH_EXPIRATION_DAYS,
          secret: c.env.JWT_SECRET,
        });

        return c.jsonT({
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            isEmailVerified: user.isEmailVerified,
          },
          tokens,
        });
      } catch (error) {
        return c.text(USER_ERROR_MESSAGE, 400);
      }
    }
  );
