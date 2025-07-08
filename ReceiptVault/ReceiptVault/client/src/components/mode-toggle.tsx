import { Button } from "@/components/ui/button";
import { Camera, Images } from "lucide-react";

interface ModeToggleProps {
  currentMode: 'capture' | 'view';
  onModeChange: (mode: 'capture' | 'view') => void;
}

export function ModeToggle({ currentMode, onModeChange }: ModeToggleProps) {
  return (
    <div className="max-w-lg mx-auto px-4 py-4">
      <div className="bg-surface rounded-xl p-1 shadow-sm">
        <div className="grid grid-cols-2 gap-1">
          <Button
            onClick={() => onModeChange('capture')}
            className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
              currentMode === 'capture'
                ? 'bg-primary text-white'
                : 'bg-transparent text-gray-600 hover:bg-gray-50'
            }`}
            variant="ghost"
          >
            <Camera className="w-4 h-4 mr-2" />
            Capture
          </Button>
          <Button
            onClick={() => onModeChange('view')}
            className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
              currentMode === 'view'
                ? 'bg-primary text-white'
                : 'bg-transparent text-gray-600 hover:bg-gray-50'
            }`}
            variant="ghost"
          >
            <Images className="w-4 h-4 mr-2" />
            View
          </Button>
        </div>
      </div>
    </div>
  );
}
