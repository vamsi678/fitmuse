import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { analyzeClothingImage, generateOutfitRecommendation, generateOutfitImage, detectGarmentsInCollage, analyzeCelebrityOutfit, ClothingAnalysis, MoodboardData, StyleVibeData, CelebrityOutfitAnalysis } from "./openai";
import bcrypt from "bcrypt";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      if (username.length < 3) {
        return res.status(400).json({ error: "Username must be at least 3 characters" });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already taken" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({ username, password: hashedPassword });

      req.session.userId = user.id;
      res.json({ id: user.id, username: user.username });
    } catch (error: any) {
      console.error("Error during signup:", error);
      res.status(500).json({ error: error.message || "Failed to sign up" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      req.session.userId = user.id;
      res.json({ id: user.id, username: user.username });
    } catch (error: any) {
      console.error("Error during login:", error);
      res.status(500).json({ error: error.message || "Failed to log in" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to log out" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      res.json({ id: user.id, username: user.username });
    } catch (error: any) {
      console.error("Error fetching current user:", error);
      res.status(500).json({ error: error.message || "Failed to fetch user" });
    }
  });

  // Analyze a single clothing image
  app.post("/api/analyze-clothing", async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      
      if (!imageBase64) {
        return res.status(400).json({ error: "Missing imageBase64" });
      }

      const analysis = await analyzeClothingImage(imageBase64);
      res.json(analysis);
    } catch (error: any) {
      console.error("Error analyzing clothing:", error);
      res.status(500).json({ error: error.message || "Failed to analyze clothing" });
    }
  });

  // Get moodboard data
  app.get("/api/moodboards", async (req, res) => {
    try {
      const moodboards = await storage.getAllMoodboards();
      res.json(moodboards);
    } catch (error: any) {
      console.error("Error fetching moodboards:", error);
      res.status(500).json({ error: error.message || "Failed to fetch moodboards" });
    }
  });

  // Get style vibes data
  app.get("/api/style-vibes", async (req, res) => {
    try {
      const styleVibes = await storage.getAllStyleVibes();
      res.json(styleVibes);
    } catch (error: any) {
      console.error("Error fetching style vibes:", error);
      res.status(500).json({ error: error.message || "Failed to fetch style vibes" });
    }
  });

  // Analyze celebrity/character outfit for inspiration
  app.post("/api/analyze-celebrity-outfit", async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      
      if (!imageBase64) {
        return res.status(400).json({ error: "Missing imageBase64" });
      }

      const analysis = await analyzeCelebrityOutfit(imageBase64);
      res.json(analysis);
    } catch (error: any) {
      console.error("Error analyzing celebrity outfit:", error);
      res.status(500).json({ error: error.message || "Failed to analyze celebrity outfit" });
    }
  });

  // Generate outfit recommendation and image
  app.post("/api/generate-outfit", async (req, res) => {
    try {
      const { items, mood, styleVibe, colorDirection, hasSketch, celebrityInspiration } = req.body;

      if (!items || !Array.isArray(items) || items.length < 2) {
        return res.status(400).json({ error: "Need at least 2 items in closet" });
      }

      if (!mood) {
        return res.status(400).json({ error: "Mood is required" });
      }

      // Fetch moodboard from database
      const moodboardRecord = await storage.getMoodboard(mood);
      let moodboard: MoodboardData | undefined;
      
      if (moodboardRecord) {
        moodboard = {
          name: moodboardRecord.name,
          colorPalette: moodboardRecord.colorPalette,
          textures: moodboardRecord.textures,
          silhouettes: moodboardRecord.silhouettes,
          typicalPieces: moodboardRecord.typicalPieces,
          stylingLogic: moodboardRecord.stylingLogic,
          exampleOutfit: moodboardRecord.exampleOutfit
        };
      }

      // Fetch style vibe from database if provided
      let styleVibeData: StyleVibeData | undefined;
      if (styleVibe) {
        const styleVibeRecord = await storage.getStyleVibe(styleVibe);
        if (styleVibeRecord) {
          styleVibeData = {
            name: styleVibeRecord.name,
            colorTendencies: styleVibeRecord.colorTendencies,
            textures: styleVibeRecord.textures,
            silhouettes: styleVibeRecord.silhouettes,
            typicalPieces: styleVibeRecord.typicalPieces,
            stylingRules: styleVibeRecord.stylingRules,
            exampleOutfit: styleVibeRecord.exampleOutfit
          };
        }
      }

      // Generate outfit recommendation - AI selects from user's closet items by ID
      const recommendation = await generateOutfitRecommendation(
        items,
        mood,
        moodboard,
        styleVibeData,
        colorDirection,
        hasSketch,
        celebrityInspiration
      );

      res.json(recommendation);
    } catch (error: any) {
      console.error("Error generating outfit:", error);
      res.status(500).json({ error: error.message || "Failed to generate outfit" });
    }
  });

  // Detect individual garments in a collage image
  app.post("/api/detect-garments", async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      
      if (!imageBase64) {
        return res.status(400).json({ error: "Missing imageBase64" });
      }

      const result = await detectGarmentsInCollage(imageBase64);
      res.json(result);
    } catch (error: any) {
      console.error("Error detecting garments:", error);
      res.status(500).json({ error: error.message || "Failed to detect garments" });
    }
  });

  // Generate outfit visualization image
  app.post("/api/generate-outfit-image", async (req, res) => {
    try {
      const { items, mood, styleVibe } = req.body;

      if (!items || !Array.isArray(items) || items.length < 1) {
        return res.status(400).json({ error: "Need at least 1 item for outfit image" });
      }

      if (!mood) {
        return res.status(400).json({ error: "Mood is required" });
      }

      const outfitImageBase64 = await generateOutfitImage({
        items,
        mood,
        styleVibe
      });

      res.json({ imageUrl: outfitImageBase64 });
    } catch (error: any) {
      console.error("Error generating outfit image:", error);
      res.status(500).json({ error: error.message || "Failed to generate outfit image" });
    }
  });

  // Get saved outfits for current user
  app.get("/api/saved-outfits", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const outfits = await storage.getSavedOutfitsByUser(req.session.userId);
      res.json(outfits);
    } catch (error: any) {
      console.error("Error fetching saved outfits:", error);
      res.status(500).json({ error: error.message || "Failed to fetch saved outfits" });
    }
  });

  // Save an outfit
  app.post("/api/saved-outfits", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { name, mood, styleVibe, items, explanation, styleNotes, compositeImage } = req.body;

      if (!name || !mood || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Name, mood, and items are required" });
      }

      if (!explanation) {
        return res.status(400).json({ error: "Explanation is required" });
      }

      const outfit = await storage.createSavedOutfit({
        userId: req.session.userId,
        name,
        mood,
        styleVibe: styleVibe || null,
        items,
        explanation,
        styleNotes: styleNotes || null,
        compositeImage: compositeImage || null,
      });

      res.json(outfit);
    } catch (error: any) {
      console.error("Error saving outfit:", error);
      res.status(500).json({ error: error.message || "Failed to save outfit" });
    }
  });

  // Delete a saved outfit
  app.delete("/api/saved-outfits/:id", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { id } = req.params;
      const deleted = await storage.deleteSavedOutfit(id, req.session.userId);

      if (!deleted) {
        return res.status(404).json({ error: "Outfit not found or not authorized" });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting outfit:", error);
      res.status(500).json({ error: error.message || "Failed to delete outfit" });
    }
  });

  return httpServer;
}
