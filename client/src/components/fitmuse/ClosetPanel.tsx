import { useState, useRef } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ClothingAnalysis } from "@/lib/api";

export interface ClosetItem {
  id: string;
  file: File;
  preview: string;
  name: string;
  analysis?: ClothingAnalysis;
  isAnalyzing?: boolean;
}

interface ClosetPanelProps {
  items: ClosetItem[];
  onAddItems: (files: FileList) => void;
  onRemoveItem: (id: string) => void;
}

export function ClosetPanel({ items, onAddItems, onRemoveItem }: ClosetPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddItems(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onAddItems(e.dataTransfer.files);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6 p-6 bg-white rounded-3xl border border-border shadow-sm relative overflow-hidden">
      <div>
        <h2 className="text-2xl font-serif mb-2">2. Your Closet</h2>
        <p className="text-sm text-muted-foreground">Upload photos of your clothes—AI will analyze each piece.</p>
      </div>

      <div 
        className={cn(
          "flex-1 flex flex-col relative rounded-2xl border-2 border-dashed transition-colors duration-300",
          isDragging ? "border-primary bg-primary/5" : "border-border bg-slate-50/50"
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
             <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4">
               <Upload className="w-8 h-8 text-muted-foreground" />
             </div>
             <h3 className="font-medium text-lg mb-1">Upload Clothes</h3>
             <p className="text-sm text-muted-foreground mb-6">Drag & drop or select images</p>
             <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="rounded-full" data-testid="button-select-files">
               Select Files
             </Button>
          </div>
        ) : (
          <ScrollArea className="flex-1 p-4 h-full">
            <div className="grid grid-cols-2 gap-4">
              {items.map((item) => (
                <div key={item.id} className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-white shadow-sm border border-border flex flex-col">
                  <div className="relative flex-1 overflow-hidden">
                    <img 
                      src={item.preview} 
                      alt={item.name} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      data-testid={`img-closet-${item.id}`}
                    />
                    {item.isAnalyzing && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                      </div>
                    )}
                    <button 
                      onClick={() => onRemoveItem(item.id)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-50 z-10"
                      data-testid={`button-remove-${item.id}`}
                    >
                      <X className="w-3 h-3 text-red-500" />
                    </button>
                  </div>
                  
                  <div className="p-2 bg-white text-[10px] border-t">
                    <div className="truncate font-medium mb-1">{item.name}</div>
                    {item.analysis && (
                      <div className="flex flex-wrap gap-1 opacity-60">
                        <span className="bg-slate-100 px-1 rounded">{item.analysis.category}</span>
                        {item.analysis.style_vibes && item.analysis.style_vibes.length > 0 && (
                          <span className="bg-slate-100 px-1 rounded">{item.analysis.style_vibes[0]}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <button 
                 onClick={() => fileInputRef.current?.click()}
                 className="aspect-[3/4] rounded-xl border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center gap-2 hover:bg-muted/50 transition-colors"
                 data-testid="button-add-more"
              >
                <Upload className="w-6 h-6 text-muted-foreground/50" />
                <span className="text-xs text-muted-foreground">Add More</span>
              </button>
            </div>
          </ScrollArea>
        )}
        
        <input 
          type="file" 
          ref={fileInputRef} 
          multiple 
          accept="image/png, image/jpeg, image/jpg" 
          className="hidden" 
          onChange={handleFileChange}
          data-testid="input-file-upload"
        />
      </div>
      
      <div className="flex justify-between items-center text-xs text-muted-foreground px-1">
        <span data-testid="text-closet-count">{items.length} items in closet</span>
        <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} data-testid="button-add-to-closet">
          Add to Closet
        </Button>
      </div>
    </div>
  );
}
