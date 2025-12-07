import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const moodboards = pgTable("moodboards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  colorPalette: text("color_palette").array().notNull(),
  textures: text("textures").array().notNull(),
  silhouettes: text("silhouettes").array().notNull(),
  typicalPieces: text("typical_pieces").array().notNull(),
  stylingLogic: text("styling_logic").array().notNull(),
  exampleOutfit: text("example_outfit").array().notNull(),
});

export const insertMoodboardSchema = createInsertSchema(moodboards).omit({
  id: true,
});

export type InsertMoodboard = z.infer<typeof insertMoodboardSchema>;
export type Moodboard = typeof moodboards.$inferSelect;

export const styleVibes = pgTable("style_vibes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  colorTendencies: text("color_tendencies").array().notNull(),
  textures: text("textures").array().notNull(),
  silhouettes: text("silhouettes").array().notNull(),
  typicalPieces: text("typical_pieces").array().notNull(),
  stylingRules: text("styling_rules").array().notNull(),
  exampleOutfit: text("example_outfit").array().notNull(),
});

export const insertStyleVibeSchema = createInsertSchema(styleVibes).omit({
  id: true,
});

export type InsertStyleVibe = z.infer<typeof insertStyleVibeSchema>;
export type StyleVibe = typeof styleVibes.$inferSelect;

export const savedOutfitItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  preview: z.string(),
  category: z.string().optional(),
});

export type SavedOutfitItem = z.infer<typeof savedOutfitItemSchema>;

export const savedOutfits = pgTable("saved_outfits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  mood: text("mood").notNull(),
  styleVibe: text("style_vibe"),
  items: jsonb("items").notNull().$type<SavedOutfitItem[]>(),
  explanation: text("explanation").notNull(),
  styleNotes: text("style_notes"),
  compositeImage: text("composite_image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSavedOutfitSchema = createInsertSchema(savedOutfits).omit({
  id: true,
  createdAt: true,
});

export type InsertSavedOutfit = z.infer<typeof insertSavedOutfitSchema>;
export type SavedOutfit = typeof savedOutfits.$inferSelect;
