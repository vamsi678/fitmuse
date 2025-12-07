import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Loader2, Heart, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { SavedOutfit } from "@shared/schema";

interface SavedOutfitsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SavedOutfitsPanel({ isOpen, onClose }: SavedOutfitsPanelProps) {
  const { toast } = useToast();
  const [outfits, setOutfits] = useState<SavedOutfit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedOutfit, setSelectedOutfit] = useState<SavedOutfit | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchOutfits();
    }
  }, [isOpen]);

  const fetchOutfits = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/saved-outfits');
      if (!response.ok) {
        throw new Error('Failed to fetch outfits');
      }
      const data = await response.json();
      setOutfits(data);
    } catch (error: any) {
      console.error('Failed to fetch saved outfits:', error);
      toast({
        title: "Error",
        description: "Could not load your saved outfits.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const response = await fetch(`/api/saved-outfits/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete outfit');
      }
      
      setOutfits(prev => prev.filter(o => o.id !== id));
      if (selectedOutfit?.id === id) {
        setSelectedOutfit(null);
      }
      toast({
        title: "Outfit Deleted",
        description: "The outfit has been removed from your collection.",
      });
    } catch (error: any) {
      console.error('Failed to delete outfit:', error);
      toast({
        title: "Delete Failed",
        description: "Could not delete the outfit. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr: string | Date) => {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#e8e4dc] w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
            <h2 className="text-2xl font-serif text-slate-800">My Saved Outfits</h2>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="rounded-full"
            data-testid="button-close-saved-outfits"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-hidden flex">
          <div className="w-1/2 border-r border-slate-200 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-slate-400 animate-spin mb-3" />
                <p className="text-slate-500">Loading your outfits...</p>
              </div>
            ) : outfits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Heart className="w-12 h-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-600 mb-2">No Saved Outfits Yet</h3>
                <p className="text-sm text-slate-400 max-w-xs">
                  Generate outfits and save your favorites to build your collection.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {outfits.map((outfit) => (
                  <motion.div
                    key={outfit.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`bg-white rounded-xl p-4 cursor-pointer transition-all ${
                      selectedOutfit?.id === outfit.id 
                        ? 'ring-2 ring-rose-400 shadow-lg' 
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => setSelectedOutfit(outfit)}
                    data-testid={`outfit-card-${outfit.id}`}
                  >
                    <div className="flex items-start gap-3">
                      {outfit.compositeImage ? (
                        <img 
                          src={outfit.compositeImage} 
                          alt={outfit.name}
                          className="w-16 h-20 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-16 h-20 bg-slate-100 rounded-lg flex items-center justify-center">
                          <Heart className="w-6 h-6 text-slate-300" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-slate-800 truncate" data-testid={`outfit-name-${outfit.id}`}>
                          {outfit.name}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(outfit.createdAt)}</span>
                        </div>
                        <div className="flex gap-1 mt-2 flex-wrap">
                          <span className="text-xs px-2 py-0.5 bg-slate-100 rounded-full text-slate-600">
                            {outfit.mood}
                          </span>
                          {outfit.styleVibe && (
                            <span className="text-xs px-2 py-0.5 bg-purple-50 rounded-full text-purple-600">
                              {outfit.styleVibe}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-slate-400 hover:text-red-500 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(outfit.id);
                        }}
                        disabled={deletingId === outfit.id}
                        data-testid={`button-delete-outfit-${outfit.id}`}
                      >
                        {deletingId === outfit.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <div className="w-1/2 overflow-y-auto p-6 bg-white/30">
            <AnimatePresence mode="wait">
              {selectedOutfit ? (
                <motion.div
                  key={selectedOutfit.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <h3 className="text-xl font-serif text-slate-800" data-testid="selected-outfit-name">
                    {selectedOutfit.name}
                  </h3>
                  
                  {selectedOutfit.compositeImage && (
                    <div className="rounded-2xl overflow-hidden bg-white shadow-lg">
                      <img 
                        src={selectedOutfit.compositeImage} 
                        alt={selectedOutfit.name}
                        className="w-full h-auto"
                        data-testid="selected-outfit-image"
                      />
                    </div>
                  )}
                  
                  <div className="flex gap-2 flex-wrap">
                    {selectedOutfit.items.map((item, idx) => (
                      <div 
                        key={idx}
                        className="w-14 h-14 rounded-lg overflow-hidden bg-white shadow border-2 border-white"
                        data-testid={`selected-outfit-item-${idx}`}
                      >
                        <img 
                          src={item.preview} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  
                  <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl">
                    <p className="text-slate-700" data-testid="selected-outfit-explanation">
                      {selectedOutfit.explanation}
                    </p>
                    {selectedOutfit.styleNotes && (
                      <p className="text-sm text-slate-500 mt-2 italic">
                        {selectedOutfit.styleNotes}
                      </p>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center text-center py-20"
                >
                  <Heart className="w-10 h-10 text-slate-300 mb-3" />
                  <p className="text-slate-400">Select an outfit to view details</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
