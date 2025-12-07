import { useState, useRef, useEffect } from "react";
import { Paintbrush, Eraser, Undo, Upload, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CreativePanelProps {
  onStyleChange: (style: string) => void;
  onColorDirChange: (dir: string) => void;
  onSketchUpdate: (data: string) => void;
  onInspirationChange?: (imageBase64: string | null) => void;
}

export function CreativePanel({ onStyleChange, onColorDirChange, onSketchUpdate, onInspirationChange }: CreativePanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inspirationInputRef = useRef<HTMLInputElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [inspirationImage, setInspirationImage] = useState<string | null>(null);
  const [inspirationPreview, setInspirationPreview] = useState<string | null>(null);

  const handleInspirationUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setInspirationImage(base64);
      setInspirationPreview(URL.createObjectURL(file));
      onInspirationChange?.(base64);
    };
    reader.readAsDataURL(file);
  };

  const clearInspiration = () => {
    setInspirationImage(null);
    setInspirationPreview(null);
    onInspirationChange?.(null);
    if (inspirationInputRef.current) {
      inspirationInputRef.current.value = "";
    }
  };

  useEffect(() => {
    if (canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        context.lineCap = "round";
        context.lineJoin = "round";
        context.lineWidth = 3;
        context.strokeStyle = "#000";
        setCtx(context);
        
        // Set white background initially so it's not transparent
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, 250, 250);
      }
    }
  }, []);

  const startDrawing = (e: React.MouseEvent) => {
    if (!ctx) return;
    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing || !ctx) return;
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing || !ctx || !canvasRef.current) return;
    setIsDrawing(false);
    onSketchUpdate(canvasRef.current.toDataURL());
  };

  const clearCanvas = () => {
    if (!ctx || !canvasRef.current) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 250, 250);
    onSketchUpdate("");
  };

  return (
    <div className="h-full flex flex-col space-y-6 p-6 bg-white/50 rounded-3xl border border-white/60 shadow-sm">
      <div>
        <h2 className="text-2xl font-serif mb-2">3. Creative Tools</h2>
        <p className="text-sm text-muted-foreground">Fine-tune the aesthetic logic.</p>
      </div>

      {/* Tool 0: Celebrity Inspiration (Optional) */}
      <div className="space-y-3 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200/50 shadow-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-500" />
          <h3 className="font-medium text-sm uppercase tracking-wider text-purple-700">Style Inspiration</h3>
          <span className="text-xs text-purple-400">(Optional)</span>
        </div>
        
        {inspirationPreview ? (
          <div className="space-y-2">
            <div className="relative w-full aspect-square max-w-[120px] mx-auto rounded-lg overflow-hidden border-2 border-purple-300 shadow-md">
              <img 
                src={inspirationPreview} 
                alt="Style inspiration" 
                className="w-full h-full object-cover"
                data-testid="img-inspiration-preview"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 w-6 h-6 rounded-full"
                onClick={clearInspiration}
                data-testid="button-clear-inspiration"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
            <p className="text-xs text-center text-purple-600">
              We'll match this style using your closet only
            </p>
          </div>
        ) : (
          <div 
            className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-purple-300 rounded-lg cursor-pointer hover:bg-purple-100/50 transition-colors"
            onClick={() => inspirationInputRef.current?.click()}
            data-testid="button-upload-inspiration"
          >
            <Upload className="w-8 h-8 text-purple-400 mb-2" />
            <p className="text-sm text-purple-600 font-medium">Upload celebrity outfit</p>
            <p className="text-xs text-purple-400">Get a similar look from your closet</p>
          </div>
        )}
        
        <input
          ref={inspirationInputRef}
          type="file"
          accept="image/*"
          onChange={handleInspirationUpload}
          className="hidden"
          data-testid="input-inspiration-file"
        />
      </div>

      {/* Tool 1: Style Adjustments */}
      <div className="space-y-4 p-4 bg-white rounded-xl border border-border/50 shadow-sm">
        <h3 className="font-medium text-sm uppercase tracking-wider text-muted-foreground">Style Parameters</h3>
        
        <div className="space-y-2">
          <Label>Change Vibe</Label>
          <Select onValueChange={onStyleChange}>
            <SelectTrigger className="bg-transparent">
              <SelectValue placeholder="Select vibe..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Streetwear">Streetwear</SelectItem>
              <SelectItem value="Minimalist">Minimalist</SelectItem>
              <SelectItem value="Vintage">Vintage</SelectItem>
              <SelectItem value="Sporty">Sporty</SelectItem>
              <SelectItem value="Romantic">Romantic</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Color Direction</Label>
          <Select onValueChange={onColorDirChange}>
            <SelectTrigger className="bg-transparent">
              <SelectValue placeholder="Select direction..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Neutral">More Neutral</SelectItem>
              <SelectItem value="Contrast">High Contrast</SelectItem>
              <SelectItem value="Monochrome">Monochrome</SelectItem>
              <SelectItem value="PaletteMatch">Match Mood Palette</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tool 2: Sketch Prompt */}
      <div className="flex-1 flex flex-col space-y-3">
        <div className="flex justify-between items-center">
          <Label>Silhouette Sketch</Label>
          <Button variant="ghost" size="sm" onClick={clearCanvas} className="h-6 px-2 text-xs">
            <Eraser className="w-3 h-3 mr-1" /> Clear
          </Button>
        </div>
        
        <div className="flex-1 flex items-center justify-center bg-white rounded-xl border border-border overflow-hidden shadow-inner">
          <canvas
            ref={canvasRef}
            width={250}
            height={250}
            className="cursor-crosshair touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
        </div>
        
        <p className="text-xs text-center text-muted-foreground">
          Draw a rough silhouette to guide item selection
        </p>
      </div>
    </div>
  );
}
