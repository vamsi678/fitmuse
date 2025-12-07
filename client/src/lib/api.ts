export interface ClothingAnalysis {
  category: string;
  colors: string[];
  style_vibes: string[];
  formality: "casual" | "smart-casual" | "formal" | "athletic";
  season: string[];
  description: string;
}

export async function analyzeClothing(imageBase64: string): Promise<ClothingAnalysis> {
  const response = await fetch("/api/analyze-clothing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64 })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to analyze clothing");
  }

  return response.json();
}

export interface OutfitRecommendation {
  selected_item_ids: string[];
  explanation: string;
  style_notes: string;
}

export async function generateOutfit(params: {
  items: Array<{ id: string; analysis: ClothingAnalysis; name: string }>;
  mood: string;
  styleVibe?: string;
  colorDirection?: string;
  hasSketch?: boolean;
  celebrityInspiration?: CelebrityOutfitAnalysis;
}): Promise<OutfitRecommendation> {
  const response = await fetch("/api/generate-outfit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to generate outfit");
  }

  return response.json();
}

export async function generateOutfitImage(params: {
  items: Array<{ analysis: ClothingAnalysis; name: string }>;
  mood: string;
  styleVibe?: string;
}): Promise<{ imageUrl: string }> {
  const response = await fetch("/api/generate-outfit-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to generate outfit image");
  }

  return response.json();
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

export async function detectGarments(imageBase64: string): Promise<CollageDetectionResult> {
  const response = await fetch("/api/detect-garments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64 })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to detect garments");
  }

  return response.json();
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
  const response = await fetch("/api/analyze-celebrity-outfit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64 })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to analyze celebrity outfit");
  }

  return response.json();
}
