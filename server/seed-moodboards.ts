import { storage } from "./storage";
import type { InsertMoodboard, InsertStyleVibe } from "@shared/schema";

const moodboardData: InsertMoodboard[] = [
  {
    name: "Calm",
    colorPalette: ["Soft blue", "Light grey", "White", "Beige", "Dusty lavender"],
    textures: ["Cotton", "Soft knits", "Linen", "Light fleece"],
    silhouettes: ["Relaxed fit", "Straight leg", "Loose sweaters", "Soft drape"],
    typicalPieces: ["Oversized sweatshirt", "Light knit sweaters", "Straight leg jeans", "Linen pants", "White sneakers", "Soft tote bag"],
    stylingLogic: ["Avoid sharp contrast", "Prioritize comfort and balance", "Keep colors light and muted", "Choose pieces with smooth textures"],
    exampleOutfit: ["Beige oversized sweatshirt", "Light blue denim", "Pale-toned sneakers", "Grey crossbody bag"]
  },
  {
    name: "Energetic",
    colorPalette: ["Red", "Hot pink", "Yellow", "Orange", "Bright white"],
    textures: ["Nylon", "Mesh", "Activewear materials", "Denim"],
    silhouettes: ["Fitted tops", "Cropped cuts", "Sporty shapes", "High contrast color blocks"],
    typicalPieces: ["Bright cropped hoodie", "Color block jacket", "Track pants", "Sneakers with bold accents", "Chunky backpacks"],
    stylingLogic: ["Use at least one high-energy color", "Combine contrast colors", "Include sporty or movement-forward shapes", "Add at least one statement piece"],
    exampleOutfit: ["Yellow crop sweatshirt", "Black and white block leggings", "Red sneakers", "Mini backpack"]
  },
  {
    name: "Dark",
    colorPalette: ["Black", "Charcoal", "Dark olive", "Deep navy"],
    textures: ["Leather", "Denim", "Heavy cotton", "Ribbing"],
    silhouettes: ["Structured", "Streamlined", "Slightly oversized outerwear"],
    typicalPieces: ["Black jeans", "Leather jacket", "Dark crewneck", "Combat boots", "Structured tote"],
    stylingLogic: ["Keep outfit low contrast", "Mix matte and slightly shiny textures", "Silhouette should feel grounded and strong"],
    exampleOutfit: ["Charcoal crewneck", "Black straight jeans", "Dark boots", "Olive structured bag"]
  },
  {
    name: "Bright",
    colorPalette: ["Bright teal", "Hot pink", "Lime", "Sky blue", "Sunshine yellow"],
    textures: ["Light cotton", "Breathable knits", "Canvas", "Fun prints"],
    silhouettes: ["Playful", "Balanced but not too structured", "Layerable pieces"],
    typicalPieces: ["Patterned top", "Colorful skirt or relaxed pants", "Fun sneakers", "Small colorful accessories"],
    stylingLogic: ["Use at least two bright colors", "Add prints or patterns when possible", "Keep overall vibe fun and expressive"],
    exampleOutfit: ["Pink patterned top", "Sky-blue wide-leg pants", "Yellow canvas sneakers", "Colorful hair clip or bag"]
  },
  {
    name: "Soft",
    colorPalette: ["Cream", "Rose", "Blush pink", "Warm beige", "Soft white"],
    textures: ["Ribbed knit", "Wool blend", "Brushed cotton", "Satin accents"],
    silhouettes: ["Flowy", "Delicate", "Light layering"],
    typicalPieces: ["Soft knit cardigan", "Satin cami", "Beige trousers", "Pink flats or white sneakers", "Light neutral bag"],
    stylingLogic: ["Blend warm-toned neutrals", "Avoid anything too sharp", "Use soft curves in silhouette", "Prioritize warmth and gentle color harmony"],
    exampleOutfit: ["Cream cardigan", "Blush satin tank", "Beige trousers", "White sneakers"]
  },
  {
    name: "Bold",
    colorPalette: ["Black", "White", "Royal blue", "Red", "Metallic accents"],
    textures: ["Leather", "Structured cotton", "Denim", "Satin or chrome-like finishes"],
    silhouettes: ["Strong shoulders", "Defined waist", "Clean lines", "Statement shapes"],
    typicalPieces: ["Structured blazer", "High-waisted pants", "Tucked-in tee", "Boots or sleek sneakers", "Geometric bag"],
    stylingLogic: ["High contrast color pairing", "Choose strong, defined lines", "Keep the outfit intentional, not soft", "At least one dramatic element (shoulder, shoe, or color pop)"],
    exampleOutfit: ["White fitted tee", "Black wide-leg trousers", "Structured blazer", "Red bag or shoes"]
  }
];

const styleVibeData: InsertStyleVibe[] = [
  {
    name: "Streetwear",
    colorTendencies: ["Black", "Grey", "White", "Earth tones", "Occasional bold accent (red, neon, graphic prints)"],
    textures: ["Heavy cotton", "Fleece", "Nylon", "Denim", "Ribbed knits"],
    silhouettes: ["Oversized tops", "Baggy or straight leg bottoms", "Cropped puffer jackets", "Layered hoodies and tees"],
    typicalPieces: ["Hoodie", "Oversized tee", "Cargo pants", "Baggy jeans", "Puffer jacket", "Sneakers (chunky or skate style)", "Beanie or baseball cap"],
    stylingRules: ["Use relaxed silhouettes", "Use at least one statement piece (graphic print, oversized item, or bold sneaker)", "Keep color palette grounded with one accent", "Prioritize comfort and layering"],
    exampleOutfit: ["Oversized grey hoodie", "Olive cargo pants", "White skate sneakers", "Black beanie"]
  },
  {
    name: "Minimalist",
    colorTendencies: ["Black", "White", "Cream", "Taupe", "Muted grey", "Very subtle pastels"],
    textures: ["Smooth cotton", "Structured knits", "Wool blends", "Clean denim"],
    silhouettes: ["Clean lines", "Straight or tapered pants", "Boxy tops", "Simple layers"],
    typicalPieces: ["Simple crewneck", "Straight trousers", "Minimal sneakers", "Long-line coat", "Basic tee", "Structured tote"],
    stylingRules: ["Avoid patterns", "Keep contrast medium to low", "Use simple geometry (boxy top, straight pants)", "Select 2-3 colors max", "Favor structure and balance"],
    exampleOutfit: ["White crewneck", "Black straight trousers", "Clean white sneakers", "Cream structured tote"]
  },
  {
    name: "Vintage",
    colorTendencies: ["Warm browns", "Washed denim blue", "Rust", "Mustard", "Forest green", "Cream"],
    textures: ["Denim", "Wool", "Worn cotton", "Corduroy", "Crochet or knits"],
    silhouettes: ["High-waisted pieces", "Straight or wide-leg pants", "Cropped cardigans", "Relaxed jackets"],
    typicalPieces: ["Vintage wash jeans", "Cardigan", "Corduroy pants", "Retro sneakers or loafers", "Graphic tee", "Floral or textured blouse"],
    stylingRules: ["Use warm, nostalgic tones", "Mix textures (denim + knit, corduroy + cotton)", "Add one retro detail (collar, pattern, color tone)", "Avoid modern technical fabrics"],
    exampleOutfit: ["Vintage wash jeans", "Cream cropped cardigan", "Brown loafers", "Small retro shoulder bag"]
  },
  {
    name: "Sporty",
    colorTendencies: ["Black", "White", "Grey", "Neon accents", "Primary colors"],
    textures: ["Spandex", "Nylon", "Mesh", "Jersey fabric", "Technical blends"],
    silhouettes: ["Fitted tops", "Leggings or track pants", "Layered performance jackets", "Cropped hoodies"],
    typicalPieces: ["Sports bra or fitted tee", "Track jacket", "Leggings", "Running shoes", "Baseball cap"],
    stylingRules: ["Always include at least one technical fabric", "Allow bright accents for energy", "Keep silhouettes movement-friendly", "Prioritize comfort and flexibility"],
    exampleOutfit: ["Black fitted tank", "White and grey track pants", "Neon-accent running shoes", "Lightweight zip jacket"]
  },
  {
    name: "Romantic",
    colorTendencies: ["Blush pink", "Warm beige", "Cream", "Soft florals", "Lavender"],
    textures: ["Satin", "Silk-like fabrics", "Soft knits", "Lace", "Light cotton"],
    silhouettes: ["Flowing shapes", "Soft drape", "Gentle waist emphasis", "Layered light fabrics"],
    typicalPieces: ["Satin cami", "Knit cardigan", "Flowy skirt", "Soft trousers", "Ballet flats or dainty sneakers", "Ribbon details or delicate bags"],
    stylingRules: ["Keep everything soft, warm, or pastel-toned", "Use flowing or soft-edged silhouettes", "Avoid sharp lines or harsh contrast", "Add subtle feminine details (lace, bows, drape)"],
    exampleOutfit: ["Blush satin cami", "Cream knit cardigan", "Soft beige wide-leg pants", "Light sneakers or ballet flats"]
  }
];

export async function seedMoodboards(): Promise<void> {
  console.log("Seeding moodboards...");
  
  for (const moodboard of moodboardData) {
    try {
      await storage.upsertMoodboard(moodboard);
      console.log(`Seeded moodboard: ${moodboard.name}`);
    } catch (error) {
      console.error(`Failed to seed moodboard ${moodboard.name}:`, error);
    }
  }
  
  console.log("Moodboard seeding complete!");

  console.log("Seeding style vibes...");
  
  for (const styleVibe of styleVibeData) {
    try {
      await storage.upsertStyleVibe(styleVibe);
      console.log(`Seeded style vibe: ${styleVibe.name}`);
    } catch (error) {
      console.error(`Failed to seed style vibe ${styleVibe.name}:`, error);
    }
  }
  
  console.log("Style vibe seeding complete!");
}
