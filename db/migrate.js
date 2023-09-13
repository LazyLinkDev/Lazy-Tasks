import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

const sqlite = new Database(
  ".wrangler/state/v3/d1/57a64a46-c7b4-4f00-a8c9-1ef423c3702a/db.sqlite"
);
const db = drizzle(sqlite);

// this will automatically run needed migrations on the database
migrate(db, { migrationsFolder: "./migrations" });
