import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const pageviews = sqliteTable(
  "pageviews",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    path: text("path").notNull(),
    referrer: text("referrer"),
    country: text("country"),
    language: text("language"),
    // Retired 2026-08-18: user-agent strings are no longer collected — a
    // per-request UA + referrer + country + ms-timestamp tuple is a browser
    // fingerprint, which the privacy rule in CLAUDE.md exists to prevent.
    // The column stays (always NULL now) so the deployed D1 table needs no
    // migration.
    userAgent: text("user_agent"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("idx_pageviews_created_at").on(table.createdAt)],
);
