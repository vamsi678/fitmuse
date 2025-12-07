import { db } from "../server/db";
import { moodboards, styleVibes } from "../shared/schema";
import { storage } from "../server/storage";
import { analyzeClothingImage, generateOutfitRecommendation, ClothingAnalysis, MoodboardData, StyleVibeData } from "../server/openai";

const BASE_URL = "http://localhost:5000";

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];

function log(message: string) {
  console.log(`[TEST] ${message}`);
}

function logSuccess(testName: string, details?: any) {
  console.log(`✅ PASS: ${testName}`);
  results.push({ name: testName, passed: true, details });
}

function logFailure(testName: string, error: string, details?: any) {
  console.log(`❌ FAIL: ${testName}`);
  console.log(`   Error: ${error}`);
  results.push({ name: testName, passed: false, error, details });
}

async function testDatabaseConnection() {
  const testName = "Database Connection";
  try {
    const moodboardsList = await db.select().from(moodboards);
    if (moodboardsList.length > 0) {
      logSuccess(testName, { moodboardCount: moodboardsList.length });
    } else {
      logFailure(testName, "No moodboards found in database");
    }
  } catch (error: any) {
    logFailure(testName, error.message);
  }
}

async function testMoodboardsAPI() {
  const testName = "GET /api/moodboards";
  try {
    const response = await fetch(`${BASE_URL}/api/moodboards`);
    const data = await response.json();
    
    if (response.ok && Array.isArray(data) && data.length > 0) {
      logSuccess(testName, { count: data.length, names: data.map((m: any) => m.name) });
    } else {
      logFailure(testName, "Invalid response", { status: response.status, data });
    }
  } catch (error: any) {
    logFailure(testName, error.message);
  }
}

async function testStyleVibesAPI() {
  const testName = "GET /api/style-vibes";
  try {
    const response = await fetch(`${BASE_URL}/api/style-vibes`);
    const data = await response.json();
    
    if (response.ok && Array.isArray(data) && data.length > 0) {
      logSuccess(testName, { count: data.length, names: data.map((v: any) => v.name) });
    } else {
      logFailure(testName, "Invalid response", { status: response.status, data });
    }
  } catch (error: any) {
    logFailure(testName, error.message);
  }
}

async function testStorageInterface() {
  const testName = "Storage Interface - Moodboard Lookup";
  try {
    const moodboard = await storage.getMoodboard("Calm");
    if (moodboard && moodboard.name === "Calm") {
      logSuccess(testName, { 
        name: moodboard.name,
        colorPaletteCount: moodboard.colorPalette.length 
      });
    } else {
      logFailure(testName, "Moodboard 'Calm' not found");
    }
  } catch (error: any) {
    logFailure(testName, error.message);
  }
}

async function testStorageStyleVibe() {
  const testName = "Storage Interface - Style Vibe Lookup";
  try {
    const vibe = await storage.getStyleVibe("Sporty");
    if (vibe && vibe.name === "Sporty") {
      logSuccess(testName, { 
        name: vibe.name,
        typicalPiecesCount: vibe.typicalPieces.length 
      });
    } else {
      logFailure(testName, "Style vibe 'Sporty' not found");
    }
  } catch (error: any) {
    logFailure(testName, error.message);
  }
}

async function testGenerateOutfitAPI() {
  const testName = "POST /api/generate-outfit - Full Flow";
  try {
    const mockItems = [
      {
        id: "test-item-1",
        name: "White T-Shirt",
        analysis: {
          category: "top",
          colors: ["white"],
          style_vibes: ["casual", "minimalist"],
          formality: "casual" as const,
          season: ["spring", "summer"],
          description: "A basic white cotton t-shirt"
        }
      },
      {
        id: "test-item-2",
        name: "Blue Jeans",
        analysis: {
          category: "bottom",
          colors: ["blue", "indigo"],
          style_vibes: ["casual", "streetwear"],
          formality: "casual" as const,
          season: ["spring", "summer", "fall"],
          description: "Classic blue denim jeans"
        }
      },
      {
        id: "test-item-3",
        name: "Black Sneakers",
        analysis: {
          category: "shoes",
          colors: ["black"],
          style_vibes: ["sporty", "casual"],
          formality: "casual" as const,
          season: ["spring", "summer", "fall"],
          description: "Black athletic sneakers"
        }
      }
    ];

    const response = await fetch(`${BASE_URL}/api/generate-outfit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: mockItems,
        mood: "Calm",
        styleVibe: "Sporty"
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      const hasSelectedItems = Array.isArray(data.selected_item_ids) && data.selected_item_ids.length > 0;
      const hasExplanation = typeof data.explanation === "string" && data.explanation.length > 0;
      const hasStyleNotes = typeof data.style_notes === "string" && data.style_notes.length > 0;
      
      const validIds = data.selected_item_ids.every((id: string) => 
        mockItems.some(item => item.id === id)
      );

      if (hasSelectedItems && hasExplanation && hasStyleNotes && validIds) {
        logSuccess(testName, {
          selected_item_ids: data.selected_item_ids,
          explanation_preview: data.explanation.substring(0, 100) + "...",
          style_notes_preview: data.style_notes.substring(0, 50) + "..."
        });
      } else {
        logFailure(testName, "Response validation failed", {
          hasSelectedItems,
          hasExplanation,
          hasStyleNotes,
          validIds,
          selected_item_ids: data.selected_item_ids,
          mockItemIds: mockItems.map(i => i.id)
        });
      }
    } else {
      logFailure(testName, `HTTP ${response.status}`, data);
    }
  } catch (error: any) {
    logFailure(testName, error.message);
  }
}

async function testGenerateOutfitValidation() {
  const testName = "POST /api/generate-outfit - Validation";
  try {
    const response = await fetch(`${BASE_URL}/api/generate-outfit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [{ id: "1", name: "test", analysis: {} }],
        mood: "Calm"
      })
    });

    const data = await response.json();
    
    if (response.status === 400 && data.error) {
      logSuccess(testName, { error: data.error });
    } else {
      logFailure(testName, "Expected 400 validation error", { status: response.status, data });
    }
  } catch (error: any) {
    logFailure(testName, error.message);
  }
}

async function testMoodboardIntegration() {
  const testName = "Moodboard Database -> Storage -> API Integration";
  try {
    const dbMoodboards = await db.select().from(moodboards);
    const storageMoodboards = await storage.getAllMoodboards();
    const response = await fetch(`${BASE_URL}/api/moodboards`);
    const apiMoodboards = await response.json();
    
    const dbCount = dbMoodboards.length;
    const storageCount = storageMoodboards.length;
    const apiCount = apiMoodboards.length;
    
    if (dbCount === storageCount && storageCount === apiCount && dbCount > 0) {
      logSuccess(testName, { 
        dbCount, 
        storageCount, 
        apiCount,
        moodNames: dbMoodboards.map((m: any) => m.name)
      });
    } else {
      logFailure(testName, "Count mismatch across layers", { dbCount, storageCount, apiCount });
    }
  } catch (error: any) {
    logFailure(testName, error.message);
  }
}

async function testStyleVibeIntegration() {
  const testName = "StyleVibe Database -> Storage -> API Integration";
  try {
    const dbVibes = await db.select().from(styleVibes);
    const storageVibes = await storage.getAllStyleVibes();
    const response = await fetch(`${BASE_URL}/api/style-vibes`);
    const apiVibes = await response.json();
    
    const dbCount = dbVibes.length;
    const storageCount = storageVibes.length;
    const apiCount = apiVibes.length;
    
    if (dbCount === storageCount && storageCount === apiCount && dbCount > 0) {
      logSuccess(testName, { 
        dbCount, 
        storageCount, 
        apiCount,
        vibeNames: dbVibes.map((v: any) => v.name)
      });
    } else {
      logFailure(testName, "Count mismatch across layers", { dbCount, storageCount, apiCount });
    }
  } catch (error: any) {
    logFailure(testName, error.message);
  }
}

async function runAllTests() {
  console.log("\n" + "=".repeat(60));
  console.log("FitMuse Integration Test Suite");
  console.log("=".repeat(60) + "\n");
  
  console.log("🔍 Testing Database Layer...\n");
  await testDatabaseConnection();
  
  console.log("\n🔍 Testing Storage Layer...\n");
  await testStorageInterface();
  await testStorageStyleVibe();
  
  console.log("\n🔍 Testing API Endpoints...\n");
  await testMoodboardsAPI();
  await testStyleVibesAPI();
  await testGenerateOutfitValidation();
  
  console.log("\n🔍 Testing Full Integration (Database -> Storage -> API)...\n");
  await testMoodboardIntegration();
  await testStyleVibeIntegration();
  
  console.log("\n🔍 Testing AI-Powered Outfit Generation (may take a few seconds)...\n");
  await testGenerateOutfitAPI();
  
  console.log("\n" + "=".repeat(60));
  console.log("Test Summary");
  console.log("=".repeat(60));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(`\n✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total:  ${results.length}`);
  
  if (failed > 0) {
    console.log("\n⚠️  Failed Tests:");
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   - ${r.name}: ${r.error}`);
    });
  }
  
  console.log("\n" + "=".repeat(60) + "\n");
  
  process.exit(failed > 0 ? 1 : 0);
}

runAllTests().catch((error) => {
  console.error("Test runner failed:", error);
  process.exit(1);
});
