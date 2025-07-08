import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, RotateCcw, Image, Upload } from "lucide-react";
import { CameraManager } from "@/lib/camera";
import { googleDrive } from "@/lib/google-drive";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function CameraCapture() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraManagerRef = useRef<CameraManager | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      return await googleDrive.uploadReceipt(file);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Receipt uploaded successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/receipts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/receipts/recent'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    const initializeCamera = async () => {
      if (!videoRef.current) return;

      try {
        cameraManagerRef.current = new CameraManager();
        await cameraManagerRef.current.initialize(videoRef.current, {
          width: 1200,
          height: 1600,
          facingMode: 'environment',
        });
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize camera:', error);
        toast({
          title: "Camera Error",
          description: "Failed to access camera. Please check permissions.",
          variant: "destructive",
        });
      }
    };

    initializeCamera();

    return () => {
      if (cameraManagerRef.current) {
        cameraManagerRef.current.stop();
      }
    };
  }, [toast]);

  const handleCapture = async () => {
    if (!cameraManagerRef.current) return;

    setIsCapturing(true);
    try {
      const blob = await cameraManagerRef.current.capturePhoto();
      const file = new File([blob], `receipt-${Date.now()}.jpg`, { type: 'image/jpeg' });
      await uploadMutation.mutateAsync(file);
    } catch (error) {
      console.error('Capture error:', error);
      toast({
        title: "Capture Failed",
        description: "Failed to capture photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const handleSwitchCamera = async () => {
    if (!cameraManagerRef.current) return;

    try {
      await cameraManagerRef.current.switchCamera();
    } catch (error) {
      console.error('Switch camera error:', error);
      toast({
        title: "Camera Switch Failed",
        description: "Failed to switch camera.",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="max-w-lg mx-auto px-4 animate-fade-in">
      <Card className="mb-6 shadow-lg">
        <CardContent className="p-6">
          <h2 className="text-xl font-medium text-gray-900 mb-4 text-center">
            <Camera className="inline w-5 h-5 text-primary mr-2" />
            Capture Receipt
          </h2>
          
          <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-[3/4] mb-4">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            
            {!isInitialized && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="text-center text-white">
                  <Camera className="w-12 h-12 mx-auto mb-3 opacity-80" />
                  <p className="text-sm opacity-90">Initializing camera...</p>
                </div>
              </div>
            )}
            
            {isInitialized && (
              <>
                <div className="absolute inset-4 border-2 border-white border-dashed rounded-lg opacity-60"></div>
                
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                  <Button
                    onClick={handleCapture}
                    disabled={isCapturing || uploadMutation.isPending}
                    className="w-16 h-16 bg-white hover:bg-gray-100 rounded-full shadow-lg hover:scale-105 transition-transform"
                    size="icon"
                  >
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                      {isCapturing || uploadMutation.isPending ? (
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Camera className="w-6 h-6 text-white" />
                      )}
                    </div>
                  </Button>
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleSwitchCamera}
              disabled={!isInitialized}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700"
              variant="secondary"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Switch Camera
            </Button>
            <Button
              onClick={handleGalleryClick}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700"
              variant="secondary"
            >
              <Image className="w-4 h-4 mr-2" />
              From Gallery
            </Button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </CardContent>
      </Card>
    </div>
  );
}
