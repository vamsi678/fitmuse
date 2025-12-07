import OpenAI from "openai";

// This is using Replit's AI Integrations service, which provides OpenAI-compatible API access without requiring your own OpenAI API key.
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

export interface ClothingAnalysis {
  category: string;
  colors: string[];
  style_vibes: string[];
  formality: "casual" | "smart-casual" | "formal" | "athletic";
  season: string[];
  description: string;
}

export async function analyzeClothingImage(imageBase64: string): Promise<ClothingAnalysis> {
  // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze this image showing clothing. Even if there are multiple items, focus on the most prominent clothing piece visible. Provide a JSON response with these exact fields:
- category: the type of clothing (e.g., "shirt", "pants", "jacket", "dress", "shoes", "accessory", "top", "bottom", "outerwear")
- colors: array of dominant colors (e.g., ["black", "white", "navy"])
- style_vibes: array of style descriptors (e.g., ["streetwear", "minimalist", "vintage", "sporty", "romantic", "casual", "formal"])
- formality: one of "casual", "smart-casual", "formal", or "athletic"
- season: array of seasons this works for (e.g., ["spring", "summer", "fall", "winter"])
- description: brief 1-sentence description of the item

IMPORTANT: Always return valid JSON with all these fields. Never return an error message.`
          },
          {
            type: "image_url",
            image_url: {
              url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
            }
          }
        ]
      }
    ],
    response_format: { type: "json_object" },
    max_tokens: 500
  });

  const content = response.choices[0]?.message?.content || "{}";
  const parsed = JSON.parse(content);
  
  const analysis: ClothingAnalysis = {
    category: parsed.category || "clothing",
    colors: Array.isArray(parsed.colors) ? parsed.colors : ["unknown"],
    style_vibes: Array.isArray(parsed.style_vibes) ? parsed.style_vibes : ["casual"],
    formality: ["casual", "smart-casual", "formal", "athletic"].includes(parsed.formality) 
      ? parsed.formality 
      : "casual",
    season: Array.isArray(parsed.season) ? parsed.season : ["all-seasons"],
    description: parsed.description || "A clothing item"
  };
  
  return analysis;
}

export interface OutfitRecommendation {
  selected_item_ids: string[];
  explanation: string;
  style_notes: string;
}

export interface MoodboardData {
  name: string;
  colorPalette: string[];
  textures: string[];
  silhouettes: string[];
  typicalPieces: string[];
  stylingLogic: string[];
  exampleOutfit: string[];
}

export interface StyleVibeData {
  name: string;
  colorTendencies: string[];
  textures: string[];
  silhouettes: string[];
  typicalPieces: string[];
  stylingRules: string[];
  exampleOutfit: string[];
}

export async function generateOutfitRecommendation(
  items: Array<{ id: string; analysis: ClothingAnalysis; name: string }>,
  mood: string,
  moodboard?: MoodboardData,
  styleVibe?: StyleVibeData,
  colorDirection?: string,
  hasSketch?: boolean,
  celebrityInspiration?: CelebrityOutfitAnalysis
): Promise<OutfitRecommendation> {
  const itemDescriptions = items.map((item) => 
    `[ID: ${item.id}] ${item.name} - ${item.analysis.category}, colors: ${item.analysis.colors.join(", ")}, vibes: ${item.analysis.style_vibes.join(", ")}, formality: ${item.analysis.formality}, description: ${item.analysis.description}`
  ).join("\n");

  let moodGuidelines = "";
  if (moodboard) {
    moodGuidelines = `
MOODBOARD FOR "${mood.toUpperCase()}" MOOD:
- Target Colors: ${moodboard.colorPalette.join(", ")}
- Preferred Textures: ${moodboard.textures.join(", ")}
- Silhouette Style: ${moodboard.silhouettes.join(", ")}
- Typical Pieces: ${moodboard.typicalPieces.join(", ")}
- Styling Rules: ${moodboard.stylingLogic.join("; ")}
- Example Outfit: ${moodboard.exampleOutfit.join(", ")}`;
  }

  let styleVibeGuidelines = "";
  if (styleVibe) {
    styleVibeGuidelines = `
STYLE VIBE: "${styleVibe.name.toUpperCase()}"
- Color Tendencies: ${styleVibe.colorTendencies.join(", ")}
- Preferred Textures: ${styleVibe.textures.join(", ")}
- Silhouette Style: ${styleVibe.silhouettes.join(", ")}
- Typical Pieces: ${styleVibe.typicalPieces.join(", ")}
- Styling Rules: ${styleVibe.stylingRules.join("; ")}
- Example Outfit: ${styleVibe.exampleOutfit.join(", ")}`;
  }

  let celebrityGuidelines = "";
  if (celebrityInspiration) {
    celebrityGuidelines = `
CELEBRITY/CHARACTER INSPIRATION - MATCH THIS LOOK:
${celebrityInspiration.topDescription ? `- Reference Top: ${celebrityInspiration.topDescription} (colors: ${celebrityInspiration.topColors.join(", ")})` : ""}
${celebrityInspiration.bottomDescription ? `- Reference Bottom: ${celebrityInspiration.bottomDescription} (colors: ${celebrityInspiration.bottomColors.join(", ")})` : ""}
${celebrityInspiration.shoesDescription ? `- Reference Shoes: ${celebrityInspiration.shoesDescription} (colors: ${celebrityInspiration.shoesColors.join(", ")})` : ""}
${celebrityInspiration.outerwearDescription ? `- Reference Outerwear: ${celebrityInspiration.outerwearDescription} (colors: ${celebrityInspiration.outerwearColors.join(", ")})` : ""}
- Overall Vibe: ${celebrityInspiration.overallVibe}
- Dominant Colors: ${celebrityInspiration.dominantColors.join(", ")}

PRIORITY: Match the celebrity outfit as closely as possible using items from the user's closet. Find:
1. A TOP that matches the reference top's style, color, and vibe
2. A BOTTOM that matches the reference bottom's style, color, and vibe
Prioritize color matching and similar garment types.`;
  }

  const prompt = `You are a professional fashion stylist. Create an outfit from these clothing items:

${itemDescriptions}

CONSTRAINTS:
- Mood: ${mood}
${moodGuidelines}
${styleVibeGuidelines}
${celebrityGuidelines}
${colorDirection ? `- Color Direction: ${colorDirection}` : ""}
${hasSketch ? "- User provided a silhouette sketch - consider volume and shape" : ""}

OUTFIT REQUIREMENTS:
- Select EXACTLY 2 items: ONE top and ONE bottom
- Top categories include: top, shirt, blouse, tank, cami, sweater, hoodie, jacket, coat, outerwear, bikini top
- Bottom categories include: bottom, pants, jeans, shorts, skirt, trousers, bikini bottom
- If a dress is available and matches the mood, you may select just the dress (1 item)

IMPORTANT: Match clothing items to BOTH the mood criteria AND the style vibe criteria. Prioritize items whose colors, textures, silhouettes, and style match the guidelines. The outfit should feel cohesive with both the mood and vibe.

CRITICAL: You must ONLY select from the items provided above. Return the exact IDs (the strings in brackets like [ID: abc123]) of the items you select.

Return JSON with these exact fields:
- selected_item_ids: array of EXACTLY 2 item IDs (one top, one bottom) - strings only, from the [ID: xxx] brackets above
- explanation: 2-3 sentence explanation of why this outfit works for the mood/vibe and how items match the criteria
- style_notes: brief styling tip

Return ONLY valid JSON.`;

  // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    max_tokens: 800
  });

  const content = response.choices[0]?.message?.content || "{}";
  console.log("AI raw response:", content);
  const parsed = JSON.parse(content);
  
  const validItemIds = items.map(i => i.id);
  
  // Process selected_item_ids - handle various formats AI might return
  let selectedIds: string[] = [];
  
  if (Array.isArray(parsed.selected_item_ids)) {
    for (const rawId of parsed.selected_item_ids) {
      // Clean up the ID - remove [ID: ] wrapper if present
      const cleanId = String(rawId).replace(/^\[?ID:\s*/i, '').replace(/\]$/, '').trim();
      if (validItemIds.includes(cleanId)) {
        selectedIds.push(cleanId);
      } else if (validItemIds.includes(rawId)) {
        selectedIds.push(rawId);
      }
    }
  }
  
  // Fallback: Extract IDs from explanation text if none found
  if (selectedIds.length === 0 && parsed.explanation) {
    const idMatches = parsed.explanation.match(/\[ID:\s*([^\]]+)\]/g) || [];
    for (const match of idMatches) {
      const extractedId = match.replace(/^\[ID:\s*/, '').replace(/\]$/, '').trim();
      if (validItemIds.includes(extractedId) && !selectedIds.includes(extractedId)) {
        selectedIds.push(extractedId);
      }
    }
  }
  
  // Final fallback: use first 2 items if still empty
  if (selectedIds.length === 0) {
    selectedIds = validItemIds.slice(0, 2);
  }
  
  console.log("Valid item IDs:", validItemIds);
  console.log("Selected item IDs:", selectedIds);
  
  return {
    selected_item_ids: selectedIds,
    explanation: parsed.explanation || "A stylish outfit combination.",
    style_notes: parsed.style_notes || "Accessorize as needed."
  };
}

export interface DetectedGarment {
  category: string;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  description: string;
  confidence: number;
}

export interface CollageDetectionResult {
  isCollage: boolean;
  garments: DetectedGarment[];
}

export async function detectGarmentsInCollage(imageBase64: string): Promise<CollageDetectionResult> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze this image to detect if it's a collage containing MULTIPLE separate clothing items (like a grid of tops, pants, bikinis, etc.).

If the image shows MULTIPLE distinct clothing items arranged in a grid or collage format:
1. Set "isCollage" to true
2. For each clothing item, provide its bounding box as NORMALIZED coordinates (0-1 range where 0,0 is top-left and 1,1 is bottom-right)
3. The bounding box MUST capture the ENTIRE garment including:
   - All straps, ties, strings, and ribbons
   - The complete body/main portion of the garment
   - Any decorative elements that extend from the main piece
   - For bikini tops: include BOTH the cups AND all ties/straps
   - For tank tops: include the full body AND shoulder straps

If the image shows just ONE clothing item (or an outfit on a person), set "isCollage" to false and return an empty garments array.

Return JSON with this exact structure:
{
  "isCollage": boolean,
  "garments": [
    {
      "category": "top" | "bottom" | "dress" | "outerwear" | "shoes" | "accessory",
      "boundingBox": {
        "x": number (0-1, left edge - include some margin),
        "y": number (0-1, top edge - start ABOVE the topmost part like straps),
        "width": number (0-1),
        "height": number (0-1, extend BELOW the bottommost part)
      },
      "description": "brief description like 'white crew-neck t-shirt'",
      "confidence": number (0-1)
    }
  ]
}

CRITICAL INSTRUCTIONS: 
- The bounding box MUST include the COMPLETE garment from the very top (including straps/ties) to the very bottom
- Add a small margin around each garment to ensure nothing is cut off
- For items with straps or ties: the y coordinate should start ABOVE the straps, and height should extend past the bottom of the garment
- Only return garments with confidence > 0.7
- Bounding boxes must be normalized (0-1 range)
- Maximum 20 garments per image`
          },
          {
            type: "image_url",
            image_url: {
              url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
            }
          }
        ]
      }
    ],
    response_format: { type: "json_object" },
    max_tokens: 2000
  });

  const content = response.choices[0]?.message?.content || "{}";
  console.log("Collage detection response:", content);
  const parsed = JSON.parse(content);
  
  const garments: DetectedGarment[] = [];
  
  if (Array.isArray(parsed.garments)) {
    for (const g of parsed.garments) {
      // Validate all bounding box fields are numeric to prevent NaN canvas dimensions
      const bb = g.boundingBox;
      const hasValidBoundingBox = bb && 
        typeof bb.x === 'number' && !isNaN(bb.x) &&
        typeof bb.y === 'number' && !isNaN(bb.y) &&
        typeof bb.width === 'number' && !isNaN(bb.width) && bb.width > 0 &&
        typeof bb.height === 'number' && !isNaN(bb.height) && bb.height > 0;
      
      if (hasValidBoundingBox && typeof g.confidence === 'number' && g.confidence >= 0.7) {
        // Add padding to ensure the full garment is captured (5% on each side)
        const padding = 0.05;
        const paddedX = Math.max(0, bb.x - padding);
        const paddedY = Math.max(0, bb.y - padding);
        const paddedWidth = Math.min(1 - paddedX, bb.width + padding * 2);
        const paddedHeight = Math.min(1 - paddedY, bb.height + padding * 2);
        
        garments.push({
          category: g.category || "clothing",
          boundingBox: {
            x: paddedX,
            y: paddedY,
            width: Math.max(0.01, paddedWidth),
            height: Math.max(0.01, paddedHeight)
          },
          description: g.description || "A clothing item",
          confidence: g.confidence
        });
      }
    }
  }
  
  return {
    isCollage: parsed.isCollage === true && garments.length > 1,
    garments
  };
}

export interface CelebrityOutfitAnalysis {
  topDescription: string | null;
  topColors: string[];
  bottomDescription: string | null;
  bottomColors: string[];
  shoesDescription: string | null;
  shoesColors: string[];
  outerwearDescription: string | null;
  outerwearColors: string[];
  accessoryDescription: string | null;
  accessoryColors: string[];
  overallVibe: string;
  dominantColors: string[];
}

export async function analyzeCelebrityOutfit(imageBase64: string): Promise<CelebrityOutfitAnalysis> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze this image of a celebrity or character outfit. Extract detailed information about each clothing piece visible.

Return JSON with this exact structure:
{
  "topDescription": "description of the top/shirt/blouse if visible, or null",
  "topColors": ["array of colors in the top"],
  "bottomDescription": "description of pants/skirt/shorts if visible, or null",
  "bottomColors": ["array of colors in the bottom"],
  "shoesDescription": "description of footwear if visible, or null",
  "shoesColors": ["array of colors in the shoes"],
  "outerwearDescription": "description of jacket/coat if visible, or null",
  "outerwearColors": ["array of colors in outerwear"],
  "accessoryDescription": "description of main accessories if visible, or null",
  "accessoryColors": ["array of colors in accessories"],
  "overallVibe": "one word describing the style: casual, formal, streetwear, vintage, sporty, romantic, minimalist, edgy, bohemian, preppy",
  "dominantColors": ["the 2-3 most prominent colors in the entire outfit"]
}

Be specific about:
- Clothing types (e.g., "cropped white tank top", "high-waisted blue jeans", "black leather ankle boots")
- Colors (use specific color names like "navy blue", "cream white", "olive green")
- Style elements that make the outfit distinctive

Return ONLY valid JSON.`
          },
          {
            type: "image_url",
            image_url: {
              url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
            }
          }
        ]
      }
    ],
    response_format: { type: "json_object" },
    max_tokens: 1000
  });

  const content = response.choices[0]?.message?.content || "{}";
  console.log("Celebrity outfit analysis:", content);
  const parsed = JSON.parse(content);
  
  return {
    topDescription: parsed.topDescription || null,
    topColors: Array.isArray(parsed.topColors) ? parsed.topColors : [],
    bottomDescription: parsed.bottomDescription || null,
    bottomColors: Array.isArray(parsed.bottomColors) ? parsed.bottomColors : [],
    shoesDescription: parsed.shoesDescription || null,
    shoesColors: Array.isArray(parsed.shoesColors) ? parsed.shoesColors : [],
    outerwearDescription: parsed.outerwearDescription || null,
    outerwearColors: Array.isArray(parsed.outerwearColors) ? parsed.outerwearColors : [],
    accessoryDescription: parsed.accessoryDescription || null,
    accessoryColors: Array.isArray(parsed.accessoryColors) ? parsed.accessoryColors : [],
    overallVibe: parsed.overallVibe || "casual",
    dominantColors: Array.isArray(parsed.dominantColors) ? parsed.dominantColors : []
  };
}

export interface OutfitImageRequest {
  items: Array<{ analysis: ClothingAnalysis; name: string }>;
  mood: string;
  styleVibe?: string;
}

export async function generateOutfitImage(request: OutfitImageRequest): Promise<string> {
  const { items, mood, styleVibe } = request;
  
  const clothingDescriptions = items.map(item => {
    const colors = item.analysis.colors.join(" and ");
    return `${colors} ${item.analysis.description || item.analysis.category}`;
  }).join(", paired with ");

  const styleContext = styleVibe ? `${styleVibe} style` : "casual style";
  const moodContext = mood.toLowerCase();
  
  const prompt = `Fashion illustration of a stylish outfit: ${clothingDescriptions}. The outfit has a ${moodContext} mood with ${styleContext} aesthetic. Show the complete outfit on a fashion model mannequin or flat lay presentation, professional fashion photography style, clean white background, high-end fashion magazine quality, soft lighting, elegant composition.`;
  
  console.log("Generating outfit image with prompt:", prompt);
  
  try {
    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt: prompt,
      size: "1024x1024",
    });

    if (!response.data || response.data.length === 0) {
      throw new Error("No image data returned from AI");
    }
    
    const imageData = response.data[0]?.b64_json;
    if (!imageData) {
      throw new Error("Image data is empty");
    }
    
    return `data:image/png;base64,${imageData}`;
  } catch (error: any) {
    console.error("Error generating outfit image:", error);
    throw new Error(`Failed to generate outfit image: ${error.message}`);
  }
}
