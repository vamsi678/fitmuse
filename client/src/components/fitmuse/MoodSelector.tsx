import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const MOODS = [
  { name: "Calm", color: "bg-blue-100", textColor: "text-blue-900", desc: "Pastel blues & soft neutrals" },
  { name: "Energetic", color: "bg-red-100", textColor: "text-red-900", desc: "Bright reds, yellows & blocking" },
  { name: "Dark", color: "bg-slate-900", textColor: "text-slate-100", desc: "Black, charcoal, deep greens" },
  { name: "Bright", color: "bg-orange-100", textColor: "text-orange-900", desc: "Vibrant multicolors" },
  { name: "Soft", color: "bg-rose-50", textColor: "text-rose-900", desc: "Creams, beiges, pinks" },
  { name: "Bold", color: "bg-fuchsia-100", textColor: "text-fuchsia-900", desc: "High contrast, sharp silhouettes" },
];

interface MoodSelectorProps {
  currentMood: string;
  onMoodSelect: (mood: string) => void;
}

export function MoodSelector({ currentMood, onMoodSelect }: MoodSelectorProps) {
  return (
    <div className="h-full flex flex-col space-y-6 p-6 bg-white/50 rounded-3xl border border-white/60 shadow-sm">
      <div>
        <h2 className="text-2xl font-serif mb-2">1. Select Mood</h2>
        <p className="text-sm text-muted-foreground">Choose the emotional direction for your outfit.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 overflow-y-auto">
        {MOODS.map((mood) => (
          <button
            key={mood.name}
            onClick={() => onMoodSelect(mood.name)}
            className={cn(
              "group relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-300",
              currentMood === mood.name 
                ? "border-primary ring-2 ring-primary/20 scale-[1.02]" 
                : "border-transparent hover:border-primary/20 hover:bg-white/80",
              mood.color
            )}
          >
            {currentMood === mood.name && (
              <div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-sm">
                <Check className="w-3 h-3 text-black" />
              </div>
            )}
            <span className={cn("font-serif text-lg font-medium", mood.textColor)}>
              {mood.name}
            </span>
            <span className={cn("text-[10px] mt-1 opacity-60", mood.textColor)}>
              {mood.desc}
            </span>
          </button>
        ))}
      </div>

      <Button 
        className="w-full rounded-full py-6 text-base" 
        disabled={!currentMood}
        onClick={() => {}} // Already set by selection, but button confirms intent visually
      >
        {currentMood ? `Mood Set: ${currentMood}` : "Set Mood"}
      </Button>
    </div>
  );
}
