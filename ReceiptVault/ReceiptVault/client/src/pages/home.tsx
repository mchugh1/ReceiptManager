import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Receipt, Settings, User } from "lucide-react";
import { googleAuth, type GoogleUser } from "@/lib/google-auth";
import { ModeToggle } from "@/components/mode-toggle";
import { CameraCapture } from "@/components/camera-capture";
import { ReceiptGallery } from "@/components/receipt-gallery";
import { UploadProgress } from "@/components/upload-progress";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [currentMode, setCurrentMode] = useState<'capture' | 'view'>('capture');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await googleAuth.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        } else {
          setLocation('/login');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setLocation('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [setLocation]);

  const handleLogout = async () => {
    try {
      await googleAuth.logout();
      setLocation('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout Failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface shadow-md sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Receipt className="w-6 h-6 text-primary" />
              <h1 className="text-lg font-medium text-gray-900">Receipt Manager</h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="icon" className="hover:bg-gray-100">
                <Settings className="w-5 h-5 text-gray-600" />
              </Button>
              
              <div className="flex items-center space-x-2">
                {user.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.name}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700">{user.name}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mode Toggle */}
      <ModeToggle currentMode={currentMode} onModeChange={setCurrentMode} />

      {/* Content */}
      {currentMode === 'capture' ? (
        <div>
          <CameraCapture />
          <UploadProgress />
        </div>
      ) : (
        <ReceiptGallery />
      )}

      {/* Bottom Navigation */}
      <div className="max-w-lg mx-auto">
        <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-lg bg-surface border-t border-gray-200 px-4 py-2">
          <div className="flex items-center justify-around">
            <Button variant="ghost" className="flex flex-col items-center py-2 px-4 text-primary">
              <Receipt className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">Home</span>
            </Button>
            <Button variant="ghost" className="flex flex-col items-center py-2 px-4 text-gray-600">
              <Settings className="w-5 h-5 mb-1" />
              <span className="text-xs">Settings</span>
            </Button>
            <Button 
              variant="ghost" 
              className="flex flex-col items-center py-2 px-4 text-gray-600"
              onClick={handleLogout}
            >
              <User className="w-5 h-5 mb-1" />
              <span className="text-xs">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
