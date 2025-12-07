import { motion } from "framer-motion";
import { RefreshCw, RotateCcw, Loader2, ImageIcon, Sparkles, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ClosetItem } from "./ClosetPanel";
import type { CelebrityOutfitAnalysis } from "@/lib/api";

interface OutfitDisplayProps {
  selectedItems: ClosetItem[];
  explanation: string;
  styleNotes: string;
  isGenerating?: boolean;
  compositeImageUrl?: string;
  isCreatingComposite?: boolean;
  celebrityInspiration?: CelebrityOutfitAnalysis;
  inspirationImageUrl?: string;
  isSaving?: boolean;
  isSaved?: boolean;
  onRegenerate: () => void;
  onStartOver: () => void;
  onSave?: () => void;
}

export function OutfitDisplay({ 
  selectedItems,
  explanation, 
  styleNotes,
  isGenerating,
  compositeImageUrl,
  isCreatingComposite,
  celebrityInspiration,
  inspirationImageUrl,
  isSaving,
  isSaved,
  onRegenerate, 
  onStartOver,
  onSave
}: OutfitDisplayProps) {
  const getInspirationPieces = () => {
    if (!celebrityInspiration) return [];
    const pieces: { label: string; description: string; colors: string[] }[] = [];
    if (celebrityInspiration.topDescription) {
      pieces.push({ label: "Top", description: celebrityInspiration.topDescription, colors: celebrityInspiration.topColors });
    }
    if (celebrityInspiration.bottomDescription) {
      pieces.push({ label: "Bottom", description: celebrityInspiration.bottomDescription, colors: celebrityInspiration.bottomColors });
    }
    if (celebrityInspiration.outerwearDescription) {
      pieces.push({ label: "Outerwear", description: celebrityInspiration.outerwearDescription, colors: celebrityInspiration.outerwearColors });
    }
    if (celebrityInspiration.shoesDescription) {
      pieces.push({ label: "Shoes", description: celebrityInspiration.shoesDescription, colors: celebrityInspiration.shoesColors });
    }
    if (celebrityInspiration.accessoryDescription) {
      pieces.push({ label: "Accessories", description: celebrityInspiration.accessoryDescription, colors: celebrityInspiration.accessoryColors });
    }
    return pieces;
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[#e8e4dc] w-full max-w-lg rounded-3xl shadow-2xl overflow-y-auto flex flex-col max-h-[95vh]"
      >
        {/* Header */}
        <div className="text-center pt-8 pb-4">
          <h1 className="text-3xl font-serif italic text-slate-800">FitMuse</h1>
          <p className="text-sm uppercase tracking-widest text-slate-600 mt-1">Your Outfit</p>
        </div>

        {/* Selected Outfit Items */}
        <div className="flex items-center justify-center px-6 pb-4">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-slate-500 animate-spin mb-4" />
              <p className="text-slate-600 font-medium">Selecting your look...</p>
            </div>
          ) : isCreatingComposite ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <ImageIcon className="w-16 h-16 text-slate-400 mb-4" />
                <Loader2 className="w-6 h-6 text-slate-600 animate-spin absolute -bottom-1 -right-1" />
              </div>
              <p className="text-slate-600 font-medium">Creating outfit view...</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full"
            >
              {/* Composite outfit image - your actual photos stacked */}
              {compositeImageUrl && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-4 flex justify-center"
                >
                  <div className="relative rounded-2xl overflow-hidden bg-white shadow-lg mx-auto" data-testid="composite-outfit-image">
                    <img 
                      src={compositeImageUrl} 
                      alt="Your outfit - actual clothing photos combined"
                      className="w-full h-auto object-contain mx-auto block"
                    />
                  </div>
                </motion.div>
              )}

              {/* Small thumbnails of individual items */}
              <div className="flex gap-2 justify-center flex-wrap" data-testid="grid-selected-items">
                {selectedItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * index }}
                    className="relative w-16 h-16 rounded-lg overflow-hidden bg-white shadow-md border-2 border-white"
                    data-testid={`item-selected-${item.id}`}
                  >
                    <img 
                      src={item.preview} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                ))}
              </div>
              {selectedItems.length > 0 && (
                <p className="text-center text-xs text-slate-500 mt-2">Your clothing items</p>
              )}
            </motion.div>
          )}
        </div>

        {/* Explanation */}
        <div className="px-6 pb-4">
          <div className="bg-white/60 backdrop-blur-sm p-5 rounded-2xl text-center">
            <p className="text-base text-slate-700 leading-relaxed" data-testid="text-explanation">
              {explanation}
            </p>
            {styleNotes && (
              <p className="text-sm text-slate-500 mt-3 italic">
                {styleNotes}
              </p>
            )}
          </div>
        </div>

        {/* Celebrity Inspiration Breakdown */}
        {celebrityInspiration && !isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="px-6 pb-4"
            data-testid="section-inspiration-breakdown"
          >
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-2xl border border-purple-100">
              <div className="flex items-center gap-2 mb-3 justify-center">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <h3 className="text-sm font-semibold text-purple-700 uppercase tracking-wider">
                  Inspired By Your Reference
                </h3>
              </div>
              
              {inspirationImageUrl && (
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-purple-200 shadow-md">
                    <img 
                      src={inspirationImageUrl} 
                      alt="Your style inspiration"
                      className="w-full h-full object-cover"
                      data-testid="img-inspiration-reference"
                    />
                  </div>
                </div>
              )}
              
              <p className="text-center text-sm text-purple-600 mb-4 font-medium" data-testid="text-inspiration-vibe">
                {celebrityInspiration.overallVibe}
              </p>
              
              {/* Color palette from inspiration */}
              {celebrityInspiration.dominantColors.length > 0 && (
                <div className="flex justify-center gap-1 mb-4">
                  {celebrityInspiration.dominantColors.slice(0, 5).map((color, idx) => (
                    <div
                      key={idx}
                      className="w-6 h-6 rounded-full border border-white shadow-sm"
                      style={{ backgroundColor: color.toLowerCase() }}
                      title={color}
                      data-testid={`color-swatch-${idx}`}
                    />
                  ))}
                </div>
              )}
              
              {/* Breakdown of inspiration pieces */}
              <div className="space-y-2 mt-3">
                {getInspirationPieces().map((piece, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-start gap-2 text-xs bg-white/60 rounded-lg p-2"
                    data-testid={`inspiration-piece-${idx}`}
                  >
                    <span className="font-semibold text-purple-700 min-w-[70px]">{piece.label}:</span>
                    <span className="text-slate-600 flex-1">{piece.description}</span>
                    {piece.colors.length > 0 && (
                      <div className="flex gap-0.5">
                        {piece.colors.slice(0, 3).map((c, i) => (
                          <div
                            key={i}
                            className="w-3 h-3 rounded-full border border-gray-200"
                            style={{ backgroundColor: c.toLowerCase() }}
                            title={c}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <div className="p-6 flex gap-3 justify-center flex-wrap">
          {onSave && (
            <Button 
              onClick={onSave} 
              size="lg" 
              className={`rounded-full px-8 ${isSaved ? 'bg-pink-500 hover:bg-pink-600' : 'bg-rose-500 hover:bg-rose-600'} text-white`}
              disabled={isGenerating || isSaving || isSaved}
              data-testid="button-save-outfit"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Heart className={`w-4 h-4 mr-2 ${isSaved ? 'fill-current' : ''}`} />
              )}
              {isSaved ? 'Saved!' : isSaving ? 'Saving...' : 'Save Outfit'}
            </Button>
          )}
          <Button 
            onClick={onRegenerate} 
            size="lg" 
            variant="secondary"
            className="rounded-full px-8 bg-slate-200 hover:bg-slate-300 text-slate-800"
            disabled={isGenerating}
            data-testid="button-regenerate"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Regenerate
          </Button>
          <Button 
            onClick={onStartOver} 
            size="lg" 
            variant="secondary"
            className="rounded-full px-8 bg-slate-200 hover:bg-slate-300 text-slate-800"
            disabled={isGenerating}
            data-testid="button-start-over"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Start Over
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
