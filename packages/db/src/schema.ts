import type { InferSelectModel } from "drizzle-orm";
import { relations } from "drizzle-orm";
import {
  customType,
  int,
  json,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { nanoid } from "nanoid";

import { user } from "./auth-schema";

export type DistanceFunction = "COSINE" | "DOT" | "L2" | "L2_SQUARED";

export const vector = customType<{
  data: ArrayBuffer;
  config: { length: number };
  configRequired: true;
  driverData: Buffer;
}>({
  dataType(config) {
    return `VECTOR(${config.length})`;
  },
  fromDriver(value) {
    return value.buffer as ArrayBuffer;
  },
  toDriver(value) {
    return Buffer.from(value);
  },
});

export const profile = mysqlTable("profile", {
  userId: varchar("id", { length: 36 })
    .notNull()
    .primaryKey()
    .references(() => user.id),

  completionPercentage: int("completion_percentage").notNull().default(0),

  text: text("text"),
  embedding: vector("embedding", { length: 1024 }),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const profileRelations = relations(profile, ({ one }) => ({
  user: one(user, {
    fields: [profile.userId],
    references: [user.id],
  }),
}));

export const chat = mysqlTable("chat", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .notNull()
    .$defaultFn(() => nanoid()),
  title: text("title").notNull(),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => user.id),
  visibility: varchar("visibility", { length: 10, enum: ["public", "private"] })
    .notNull()
    .default("private"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const chatRelations = relations(chat, ({ one, many }) => ({
  user: one(user, {
    fields: [chat.userId],
    references: [user.id],
  }),
  messages: many(message),
}));

export const message = mysqlTable("message", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .notNull()
    .$defaultFn(() => nanoid()),
  chatId: varchar("chat_id", { length: 36 })
    .notNull()
    .references(() => chat.id),
  role: varchar("role", { length: 50, enum: ["user", "assistant"] }).notNull(),
  parts: json("content").notNull(),
  attachments: json("attachments").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const messageRelations = relations(message, ({ one }) => ({
  chat: one(chat, {
    fields: [message.chatId],
    references: [chat.id],
  }),
}));

export type DBMessage = InferSelectModel<typeof message>;

export * from "./auth-schema";
