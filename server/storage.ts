import { type User, type InsertUser, type Moodboard, type InsertMoodboard, moodboards, type StyleVibe, type InsertStyleVibe, styleVibes, users, savedOutfits, type SavedOutfit, type InsertSavedOutfit } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getMoodboard(name: string): Promise<Moodboard | undefined>;
  getAllMoodboards(): Promise<Moodboard[]>;
  upsertMoodboard(moodboard: InsertMoodboard): Promise<Moodboard>;
  getStyleVibe(name: string): Promise<StyleVibe | undefined>;
  getAllStyleVibes(): Promise<StyleVibe[]>;
  upsertStyleVibe(styleVibe: InsertStyleVibe): Promise<StyleVibe>;
  getSavedOutfitsByUser(userId: string): Promise<SavedOutfit[]>;
  getSavedOutfit(id: string): Promise<SavedOutfit | undefined>;
  createSavedOutfit(outfit: InsertSavedOutfit): Promise<SavedOutfit>;
  deleteSavedOutfit(id: string, userId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async getMoodboard(name: string): Promise<Moodboard | undefined> {
    const result = await db.select().from(moodboards).where(eq(moodboards.name, name)).limit(1);
    return result[0];
  }

  async getAllMoodboards(): Promise<Moodboard[]> {
    return await db.select().from(moodboards);
  }

  async upsertMoodboard(moodboard: InsertMoodboard): Promise<Moodboard> {
    const existing = await this.getMoodboard(moodboard.name);
    if (existing) {
      await db.update(moodboards)
        .set(moodboard)
        .where(eq(moodboards.name, moodboard.name));
      return { ...existing, ...moodboard };
    } else {
      const result = await db.insert(moodboards).values(moodboard).returning();
      return result[0];
    }
  }

  async getStyleVibe(name: string): Promise<StyleVibe | undefined> {
    const result = await db.select().from(styleVibes).where(eq(styleVibes.name, name)).limit(1);
    return result[0];
  }

  async getAllStyleVibes(): Promise<StyleVibe[]> {
    return await db.select().from(styleVibes);
  }

  async upsertStyleVibe(styleVibe: InsertStyleVibe): Promise<StyleVibe> {
    const existing = await this.getStyleVibe(styleVibe.name);
    if (existing) {
      await db.update(styleVibes)
        .set(styleVibe)
        .where(eq(styleVibes.name, styleVibe.name));
      return { ...existing, ...styleVibe };
    } else {
      const result = await db.insert(styleVibes).values(styleVibe).returning();
      return result[0];
    }
  }

  async getSavedOutfitsByUser(userId: string): Promise<SavedOutfit[]> {
    return await db.select().from(savedOutfits)
      .where(eq(savedOutfits.userId, userId))
      .orderBy(desc(savedOutfits.createdAt));
  }

  async getSavedOutfit(id: string): Promise<SavedOutfit | undefined> {
    const result = await db.select().from(savedOutfits).where(eq(savedOutfits.id, id)).limit(1);
    return result[0];
  }

  async createSavedOutfit(outfit: InsertSavedOutfit): Promise<SavedOutfit> {
    const result = await db.insert(savedOutfits).values(outfit).returning();
    return result[0];
  }

  async deleteSavedOutfit(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(savedOutfits)
      .where(and(eq(savedOutfits.id, id), eq(savedOutfits.userId, userId)))
      .returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
