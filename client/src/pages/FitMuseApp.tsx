import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Landing } from "@/components/fitmuse/Landing";
import { MoodSelector } from "@/components/fitmuse/MoodSelector";
import { ClosetPanel, ClosetItem } from "@/components/fitmuse/ClosetPanel";
import { CreativePanel } from "@/components/fitmuse/CreativePanel";
import { OutfitDisplay } from "@/components/fitmuse/OutfitDisplay";
import { SavedOutfitsPanel } from "@/components/fitmuse/SavedOutfitsPanel";
import { Button } from "@/components/ui/button";
import { Sparkles, LogOut, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { analyzeClothing, generateOutfit, detectGarments, analyzeCelebrityOutfit, ClothingAnalysis, DetectedGarment, CelebrityOutfitAnalysis } from "@/lib/api";

interface FitMuseAppProps {
  user: { id: string; username: string };
  onLogout: () => void;
}

export default function FitMuseApp({ user, onLogout }: FitMuseAppProps) {
  const { toast } = useToast();
  const [started, setStarted] = useState(false);
  
  // State
  const [mood, setMood] = useState<string>("");
  const [closetItems, setClosetItems] = useState<ClosetItem[]>([]);
  const [styleVibe, setStyleVibe] = useState<string>("");
  const [colorDirection, setColorDirection] = useState<string>("");
  const [sketchData, setSketchData] = useState<string>("");
  const [inspirationImage, setInspirationImage] = useState<string | null>(null);
  
  // Output
  const [selectedItems, setSelectedItems] = useState<ClosetItem[]>([]);
  const [explanation, setExplanation] = useState<string>("");
  const [styleNotes, setStyleNotes] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [compositeImageUrl, setCompositeImageUrl] = useState<string>("");
  const [isCreatingComposite, setIsCreatingComposite] = useState(false);
  const [celebrityAnalysis, setCelebrityAnalysis] = useState<CelebrityOutfitAnalysis | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showSavedOutfits, setShowSavedOutfits] = useState(false);

  // Create composite image from selected clothing items (flat lay style - top above bottom)
  const createCompositeImage = async (items: ClosetItem[]): Promise<string> => {
    // Sort items: tops/outerwear first, then bottoms/shoes
    const topCategories = ['top', 'shirt', 'blouse', 'jacket', 'outerwear', 'sweater', 'hoodie', 'coat', 'dress'];
    const bottomCategories = ['bottom', 'pants', 'jeans', 'shorts', 'skirt', 'trousers'];
    const footwearCategories = ['shoes', 'boots', 'sneakers', 'heels', 'sandals', 'footwear'];
    
    const sortedItems = [...items].sort((a, b) => {
      const catA = a.analysis?.category?.toLowerCase() || '';
      const catB = b.analysis?.category?.toLowerCase() || '';
      
      const getOrder = (cat: string) => {
        if (topCategories.some(t => cat.includes(t))) return 0;
        if (bottomCategories.some(t => cat.includes(t))) return 1;
        if (footwearCategories.some(t => cat.includes(t))) return 2;
        return 1; // Default to middle
      };
      
      return getOrder(catA) - getOrder(catB);
    });

    // Load all images (blob URLs don't need CORS)
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (e) => {
          console.error("Failed to load image:", src, e);
          reject(e);
        };
        img.src = src;
      });
    };

    const images = await Promise.all(sortedItems.map(item => loadImage(item.preview)));
    
    // Flat lay style: uniform sizing with proper centering
    const canvasWidth = 400;
    const targetItemWidth = 280; // Each item will be scaled to this width
    const maxItemHeight = 300; // Maximum height per item to prevent very tall items
    const gap = 20; // Gap between items
    const padding = 40; // Padding around edges
    
    // Calculate scaled dimensions for each image - scale to fit target width while respecting max height
    const scaledImages = images.map(img => {
      // Scale to target width first
      let scale = targetItemWidth / img.width;
      let width = img.width * scale;
      let height = img.height * scale;
      
      // If height exceeds max, scale down further
      if (height > maxItemHeight) {
        scale = maxItemHeight / img.height;
        width = img.width * scale;
        height = img.height * scale;
      }
      
      return {
        img,
        width: Math.round(width),
        height: Math.round(height)
      };
    });
    
    // Calculate total height
    const totalImagesHeight = scaledImages.reduce((sum, si) => sum + si.height, 0);
    const totalHeight = totalImagesHeight + (images.length - 1) * gap + padding * 2;
    
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = totalHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error('Could not get canvas context');
    
    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, totalHeight);
    
    // Draw each image, stacked vertically with gap, perfectly centered
    let yOffset = padding;
    for (const { img, width, height } of scaledImages) {
      // Center each image precisely on the canvas
      const xOffset = Math.round((canvasWidth - width) / 2);
      ctx.drawImage(img, xOffset, yOffset, width, height);
      yOffset += height + gap;
    }
    
    return canvas.toDataURL('image/png');
  };

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Load an image from a URL or data URL
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = src;
    });
  };

  // Crop a garment from an image using bounding box (normalized 0-1 coordinates)
  const cropGarment = async (imageBase64: string, garment: DetectedGarment): Promise<string> => {
    const img = await loadImage(imageBase64);
    
    const x = garment.boundingBox.x * img.width;
    const y = garment.boundingBox.y * img.height;
    const width = garment.boundingBox.width * img.width;
    const height = garment.boundingBox.height * img.height;
    
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error('Could not get canvas context');
    
    ctx.drawImage(img, x, y, width, height, 0, 0, width, height);
    return canvas.toDataURL('image/png');
  };

  // Convert data URL to blob for preview
  const dataURLtoBlob = (dataURL: string): Blob => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  // Handlers
  const handleAddItems = async (files: FileList) => {
    for (const file of Array.from(files)) {
      const base64 = await fileToBase64(file);
      const baseName = file.name.split('.')[0].replace(/[-_]/g, ' ');
      
      // Create a temporary placeholder item while detecting
      const tempId = Math.random().toString(36).substr(2, 9);
      const tempItem: ClosetItem = {
        id: tempId,
        file,
        preview: URL.createObjectURL(file),
        name: baseName,
        isAnalyzing: true
      };
      setClosetItems((prev) => [...prev, tempItem]);

      try {
        // First, detect if this is a collage with multiple garments
        const detection = await detectGarments(base64);
        
        if (detection.isCollage && detection.garments.length > 1) {
          // This is a collage - remove the temp item and add individual cropped garments
          setClosetItems((prev) => prev.filter(i => i.id !== tempId));
          
          toast({
            title: "Collage Detected",
            description: `Found ${detection.garments.length} clothing items. Extracting each one...`,
          });
          
          // Process each detected garment
          let successCount = 0;
          for (let i = 0; i < detection.garments.length; i++) {
            const garment = detection.garments[i];
            const garmentId = Math.random().toString(36).substr(2, 9);
            const garmentName = `${baseName} - ${garment.description || garment.category} ${i + 1}`;
            
            try {
              // Crop the garment from the collage
              const croppedBase64 = await cropGarment(base64, garment);
              const croppedBlob = dataURLtoBlob(croppedBase64);
              const croppedPreview = URL.createObjectURL(croppedBlob);
              
              // Add cropped item with analyzing state
              const croppedItem: ClosetItem = {
                id: garmentId,
                file: new File([croppedBlob], `${garmentName}.png`, { type: 'image/png' }),
                preview: croppedPreview,
                name: garmentName,
                isAnalyzing: true
              };
              setClosetItems((prev) => [...prev, croppedItem]);
              
              // Analyze the cropped garment
              try {
                const analysis = await analyzeClothing(croppedBase64);
                setClosetItems((prev) => 
                  prev.map((item) => 
                    item.id === garmentId 
                      ? { ...item, analysis, isAnalyzing: false } 
                      : item
                  )
                );
                successCount++;
              } catch (analyzeError: any) {
                console.error("Failed to analyze cropped garment:", analyzeError);
                // Clear analyzing state and remove failed item
                setClosetItems((prev) => prev.filter(item => item.id !== garmentId));
                toast({
                  title: "Analysis Failed",
                  description: `Could not analyze ${garmentName}`,
                  variant: "destructive"
                });
              }
            } catch (cropError: any) {
              console.error("Failed to crop garment:", cropError);
              // Don't add item if cropping failed
            }
          }
          
          if (successCount === 0 && detection.garments.length > 0) {
            toast({
              title: "Extraction Failed",
              description: "Could not extract any items from the collage. Try uploading individual images.",
              variant: "destructive"
            });
          }
        } else {
          // Not a collage - analyze as single item (existing behavior)
          const analysis = await analyzeClothing(base64);
          setClosetItems((prev) => 
            prev.map((i) => 
              i.id === tempId 
                ? { ...i, analysis, isAnalyzing: false } 
                : i
            )
          );
        }
      } catch (error: any) {
        console.error("Failed to process image:", error);
        toast({
          title: "Analysis Failed",
          description: `Could not analyze ${baseName}. ${error.message}`,
          variant: "destructive"
        });
        
        // Mark as failed
        setClosetItems((prev) => 
          prev.map((i) => 
            i.id === tempId 
              ? { ...i, isAnalyzing: false } 
              : i
          )
        );
      }
    }
  };

  const handleRemoveItem = (id: string) => {
    setClosetItems((prev) => prev.filter(item => item.id !== id));
  };

  const handleSaveOutfit = async () => {
    if (selectedItems.length === 0 || !explanation) return;
    
    setIsSaving(true);
    try {
      const outfitName = `${mood} Look - ${new Date().toLocaleDateString()}`;
      
      const itemsToSave = selectedItems.map(item => ({
        id: item.id,
        name: item.name,
        preview: item.preview,
        category: item.analysis?.category || undefined,
      }));
      
      const response = await fetch('/api/saved-outfits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: outfitName,
          mood,
          styleVibe: styleVibe || null,
          items: itemsToSave,
          explanation,
          styleNotes: styleNotes || null,
          compositeImage: compositeImageUrl || null,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save outfit');
      }
      
      setIsSaved(true);
      toast({
        title: "Outfit Saved!",
        description: "You can view your saved outfits from the menu.",
      });
    } catch (error: any) {
      console.error('Failed to save outfit:', error);
      toast({
        title: "Save Failed",
        description: error.message || "Could not save the outfit. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateOutfit = async () => {
    // Validation
    if (!mood) {
      toast({
        title: "Mood Required",
        description: "Please select a mood first.",
        variant: "destructive"
      });
      return;
    }

    const analyzedItems = closetItems.filter(item => item.analysis && !item.isAnalyzing);
    
    if (analyzedItems.length < 2) {
      toast({
        title: "Not Enough Items",
        description: "Please add at least 2 items to your closet and wait for analysis to complete.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setShowResult(true);
    setIsSaved(false);

    try {
      // Prepare items for API - pass IDs so AI can select from them
      const itemsForApi = analyzedItems.map((item) => ({
        id: item.id,
        analysis: item.analysis!,
        name: item.name
      }));

      // If celebrity inspiration image is provided, analyze it first
      let analyzedCelebrityStyle: CelebrityOutfitAnalysis | undefined;
      if (inspirationImage) {
        try {
          analyzedCelebrityStyle = await analyzeCelebrityOutfit(inspirationImage);
          setCelebrityAnalysis(analyzedCelebrityStyle);
          toast({
            title: "Style Analyzed",
            description: `Matching ${analyzedCelebrityStyle.overallVibe} vibe from your inspiration...`,
          });
        } catch (err) {
          console.error("Failed to analyze inspiration:", err);
          setCelebrityAnalysis(null);
        }
      } else {
        setCelebrityAnalysis(null);
      }

      // Call AI to generate outfit - AI returns selected item IDs
      const recommendation = await generateOutfit({
        items: itemsForApi,
        mood,
        styleVibe: styleVibe || undefined,
        colorDirection: colorDirection || undefined,
        hasSketch: !!sketchData,
        celebrityInspiration: analyzedCelebrityStyle
      });

      // Filter to get only the selected items from closet (enforces that only real items are shown)
      const selected = closetItems.filter(item => 
        recommendation.selected_item_ids.includes(item.id)
      );
      
      setSelectedItems(selected);
      setExplanation(recommendation.explanation);
      setStyleNotes(recommendation.style_notes);
      setIsGenerating(false);
      
      // Create composite image from selected items
      if (selected.length > 0) {
        setIsCreatingComposite(true);
        try {
          const compositeUrl = await createCompositeImage(selected);
          setCompositeImageUrl(compositeUrl);
        } catch (err) {
          console.error("Failed to create composite:", err);
        } finally {
          setIsCreatingComposite(false);
        }
      }
      
    } catch (error: any) {
      console.error("Failed to generate outfit:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "Could not generate outfit. Please try again.",
        variant: "destructive"
      });
      setShowResult(false);
      setIsGenerating(false);
    }
  };

  if (!started) {
    return <Landing onStart={() => setStarted(true)} />;
  }

  return (
    <div className="min-h-screen bg-background font-sans p-4 md:p-8 flex flex-col">
      <header className="flex justify-between items-center mb-8 px-4">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight" data-testid="text-app-title">FitMuse</h1>
          <p className="text-muted-foreground text-sm">Design Studio</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground" data-testid="text-username">
            Hello, {user.username}
          </span>
          <Button 
            variant="outline" 
            onClick={() => setShowSavedOutfits(true)} 
            data-testid="button-view-saved-outfits"
            className="border-rose-200 text-rose-600 hover:bg-rose-50"
          >
            <Heart className="w-4 h-4 mr-2 fill-rose-500" />
            My Outfits
          </Button>
          <Button variant="outline" onClick={() => setStarted(false)} data-testid="button-exit-studio">Exit Studio</Button>
          <Button variant="ghost" size="sm" onClick={onLogout} data-testid="button-logout" className="text-muted-foreground hover:text-destructive">
            <LogOut className="w-4 h-4 mr-1" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1600px] mx-auto w-full h-[calc(100vh-140px)]">
        {/* Left: Mood */}
        <div className="lg:col-span-3 h-full min-h-[500px]">
          <MoodSelector currentMood={mood} onMoodSelect={setMood} />
        </div>

        {/* Middle: Closet */}
        <div className="lg:col-span-5 h-full min-h-[500px]">
          <ClosetPanel 
            items={closetItems} 
            onAddItems={handleAddItems} 
            onRemoveItem={handleRemoveItem} 
          />
        </div>

        {/* Right: Creative */}
        <div className="lg:col-span-4 h-full min-h-[500px]">
          <CreativePanel 
            onStyleChange={setStyleVibe}
            onColorDirChange={setColorDirection}
            onSketchUpdate={setSketchData}
            onInspirationChange={setInspirationImage}
          />
        </div>
      </main>

      {/* Bottom Action */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40">
        <Button 
          size="lg" 
          className="rounded-full px-12 py-8 text-xl shadow-2xl hover:scale-105 transition-all duration-300 bg-primary text-primary-foreground ring-4 ring-white/50"
          onClick={handleGenerateOutfit}
          disabled={isGenerating}
          data-testid="button-generate-outfit"
        >
          {isGenerating ? (
            <>
              <Sparkles className="w-6 h-6 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Sparkles className="w-6 h-6 mr-2" />
              Generate Outfit
            </>
          )}
        </Button>
      </div>

      {/* Output Modal */}
      <AnimatePresence>
        {showResult && (
          <OutfitDisplay 
            selectedItems={selectedItems}
            explanation={explanation}
            styleNotes={styleNotes}
            isGenerating={isGenerating}
            compositeImageUrl={compositeImageUrl}
            isCreatingComposite={isCreatingComposite}
            celebrityInspiration={celebrityAnalysis || undefined}
            inspirationImageUrl={inspirationImage || undefined}
            isSaving={isSaving}
            isSaved={isSaved}
            onRegenerate={handleGenerateOutfit}
            onStartOver={() => {
              setShowResult(false);
              setSelectedItems([]);
              setExplanation("");
              setStyleNotes("");
              setCompositeImageUrl("");
              setCelebrityAnalysis(null);
              setIsSaved(false);
            }}
            onSave={handleSaveOutfit}
          />
        )}
      </AnimatePresence>

      {/* Saved Outfits Panel */}
      <SavedOutfitsPanel 
        isOpen={showSavedOutfits}
        onClose={() => setShowSavedOutfits(false)}
      />
    </div>
  );
}
