import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const todos = sqliteTable("todos", {
  id: integer("id").primaryKey(),
  message: text("message"),
  status: integer("status", { mode: "boolean" }).default(false),
});
