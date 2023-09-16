import { zValidator } from "@hono/zod-validator";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { z } from "zod";
import { users } from "../../db/schema";
import {
  generateToken,
  generateUserTokens,
  tokenTypes,
  verifyToken,
} from "../token";
import { getUserbyEmail } from "../user";
import { Bindings } from "./[[route]]";
import { add } from "date-fns";

const route = new Hono<{ Bindings: Bindings }>();
const SALT_MAGNITUDE = 10;
const USER_ERROR_MESSAGE = "Invalid Username or Password!";
const TOKEN_ERROR_MESSAGE = "Invalid token, please reauthenticate";

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
        const user = await getUserbyEmail(db, c.req.valid("form").email);

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
  )
  .post(
    "/refresh-tokens",
    zValidator("form", z.object({ refresh_token: z.string() })),
    async (c) => {
      const jwtPayload = await verifyToken(
        c.req.valid("form").refresh_token,
        tokenTypes.REFRESH,
        c.env.JWT_SECRET
      );

      const userId = Number(jwtPayload.sub);

      if (!userId) return c.text(TOKEN_ERROR_MESSAGE, 400);

      const db = drizzle(c.env.SHARED_STORAGE_DB);
      const user = (
        await db.select().from(users).where(eq(users.id, userId))
      )[0];

      if (!user) return c.text(TOKEN_ERROR_MESSAGE, 400);

      const tokens = await generateUserTokens(user, {
        accessExpirationMinutes: c.env.JWT_ACCESS_EXPIRATION_MINUTES,
        refreshExpirationDays: c.env.JWT_REFRESH_EXPIRATION_DAYS,
        secret: c.env.JWT_SECRET,
      });

      return c.jsonT({ tokens });
    }
  )
  .post(
    "/forgot-password",
    zValidator("form", z.object({ email: z.string().email() })),
    async (c) => {
      const db = drizzle(c.env.SHARED_STORAGE_DB);
      const user = await getUserbyEmail(db, c.req.valid("form").email);

      if (user) {
        const expires = add(new Date(), {
          minutes: c.env.JWT_RESET_PASSWORD_EXPIRATION_MINUTES,
        });

        const resetPasswordToken = await generateToken(
          user.id,
          tokenTypes.RESET_PASSWORD,
          expires,
          c.env.JWT_SECRET,
          user.isEmailVerified
        );

        const result = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${c.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "David Figueroa <info@dmfigueroa.com>",
            to: [user.email],
            subject: "Reset your password",
            html: `
            Hello ${user.name}
            Please reset your password by clicking the following link:
            ${resetPasswordToken}
          `,
          }),
        });
      }

      return c.text(
        "If that email address is in our database, we will send you an email to reset your password.",
        200
      );
    }
  );
