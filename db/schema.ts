import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const todos = sqliteTable("todos", {
  id: integer("id").primaryKey(),
  message: text("message"),
  status: integer("status", { mode: "boolean" }).default(false),
});

export const users = sqliteTable("users", {
  id: integer("id").primaryKey(),
  name: text("name"),
  email: text("email").unique().notNull(),
  isEmailVerified: integer("is_email_verigfied", { mode: "boolean" }).default(
    false
  ),
  passwordHash: text("password").notNull(),
});
