import { DrizzleD1Database } from "drizzle-orm/d1";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

export const getUserbyEmail = async (db: DrizzleD1Database, email: string) =>
  (await db.select().from(users).where(eq(users.email, email)))[0];
