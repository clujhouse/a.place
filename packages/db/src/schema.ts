import type { InferSelectModel } from "drizzle-orm";
import { relations } from "drizzle-orm";
import {
  boolean,
  customType,
  decimal,
  index,
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
    return `vector(${config.length})`;
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
  isOnboarded: boolean("is_onboarded").notNull().default(false),

  houseId: varchar("house_id", { length: 36 }).references(() => house.id),

  text: text("text"),
  shortBio: text("short_bio"),
  embedding: vector("embedding", { length: 1024 }),
  images: json("images").$type<string[]>().default([]),
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

export const chat = mysqlTable(
  "chat",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .notNull()
      .$defaultFn(() => nanoid()),
    title: text("title").notNull(),

    type: varchar("type", { length: 10, enum: ["profile", "main"] })
      .default("main")
      .notNull(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => user.id),
    visibility: varchar("visibility", {
      length: 10,
      enum: ["public", "private"],
    })
      .notNull()
      .default("private"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    typeIndex: index("type_index").on(table.type),
  }),
);

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
    .references(() => chat.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 50, enum: ["user", "assistant"] }).notNull(),
  parts: json("content").notNull(),
  attachments: json("attachments").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export const conversationMessage = mysqlTable("conversation_message", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .notNull()
    .$defaultFn(() => nanoid()),
  senderId: varchar("sender_id", { length: 36 })
    .notNull()
    .references(() => user.id),
  recieverId: varchar("reciever_id", { length: 36 })
    .notNull()
    .references(() => user.id),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  read: boolean("read").notNull().default(false),
});

export const messageRelations = relations(message, ({ one }) => ({
  chat: one(chat, {
    fields: [message.chatId],
    references: [chat.id],
  }),
}));

export const conversationMessageRelations = relations(
  conversationMessage,
  ({ one }) => ({
    sender: one(user, {
      fields: [conversationMessage.senderId],
      references: [user.id],
    }),
    receiver: one(user, {
      fields: [conversationMessage.recieverId],
      references: [user.id],
    }),
  }),
);

export const profileNote = mysqlTable("profile_note", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .notNull()
    .$defaultFn(() => nanoid()),
  postingUserId: varchar("posting_user_id", { length: 36 })
    .notNull()
    .references(() => user.id),
  receivingUserId: varchar("receiving_user_id", { length: 36 })
    .notNull()
    .references(() => user.id),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const profileNoteRelations = relations(profileNote, ({ one }) => ({
  postingUser: one(user, {
    fields: [profileNote.postingUserId],
    references: [user.id],
  }),
  receivingUser: one(user, {
    fields: [profileNote.receivingUserId],
    references: [user.id],
  }),
}));

export const onboardingState = mysqlTable("onboarding_state", {
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => user.id)
    .primaryKey(),
  currentStep: varchar("current_step", { length: 50 })
    .notNull()
    .default("initial"),
  extractedName: varchar("extracted_name", { length: 255 }),
  extractedLocation: varchar("extracted_location", { length: 255 }),
  extractedOneLiner: text("extracted_one_liner"),
  conversationHistory: json("conversation_history")
    .$type<
      {
        role: "user" | "assistant";
        content: string;
        timestamp: string;
      }[]
    >()
    .default([]),
  completedAt: timestamp("completed_at"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const onboardingStateRelations = relations(
  onboardingState,
  ({ one }) => ({
    user: one(user, {
      fields: [onboardingState.userId],
      references: [user.id],
    }),
  }),
);

export const house = mysqlTable("house", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .notNull()
    .$defaultFn(() => nanoid()),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  locationName: varchar("location_name", { length: 255 }),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  color: varchar("color", { length: 36 }).notNull(),
  logoImage: json("logo_image").$type<string>(),
  images: json("images").$type<string[]>().default([]),

  socialLinks: json("social_links")
    .$type<
      {
        type: "twitter" | "instagram" | "linkedin" | "website";
        url: string;
      }[]
    >()
    .default([]),
  ownerId: varchar("owner_id", { length: 36 })
    .notNull()
    .references(() => user.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type DBMessage = InferSelectModel<typeof message>;
export type DBProfileNote = InferSelectModel<typeof profileNote>;

export * from "./auth-schema";
