import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;

/** True when a DATABASE_URL is configured. When false, the app falls back to
 *  read-only sample data so the UI is viewable before a database is wired up. */
export const hasDatabase = Boolean(url);

const sql = url ? neon(url) : undefined;

export const db = sql ? drizzle(sql, { schema }) : undefined;
