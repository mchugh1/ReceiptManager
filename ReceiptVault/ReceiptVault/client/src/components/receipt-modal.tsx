import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, Download, Share2 } from "lucide-react";
import { type Receipt } from "@shared/schema";
import { format } from "date-fns";

interface ReceiptModalProps {
  receipt: Receipt;
  onClose: () => void;
}

export function ReceiptModal({ receipt, onClose }: ReceiptModalProps) {
  const handleDownload = () => {
    window.open(receipt.driveUrl, '_blank');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Receipt - ${receipt.originalName}`,
        url: receipt.driveUrl,
      });
    } else {
      navigator.clipboard.writeText(receipt.driveUrl);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <Card className="w-full max-w-lg max-h-[90vh] overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Receipt Details</h3>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <CardContent className="p-4 overflow-y-auto">
          <div className="mb-4">
            {receipt.thumbnailUrl ? (
              <img
                src={receipt.thumbnailUrl}
                alt={receipt.originalName}
                className="w-full rounded-lg shadow-md"
              />
            ) : (
              <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-500">No preview available</span>
              </div>
            )}
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">File Name:</span>
              <span className="font-medium">{receipt.fileName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Original Name:</span>
              <span className="font-medium">{receipt.originalName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Upload Date:</span>
              <span className="font-medium">
                {format(new Date(receipt.uploadDate!), 'MMM d, yyyy h:mm a')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">File Size:</span>
              <span className="font-medium">
                {(receipt.fileSize / 1024 / 1024).toFixed(1)} MB
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Drive Path:</span>
              <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                {receipt.folderPath}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mt-6">
            <Button
              onClick={handleDownload}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button
              onClick={handleShare}
              variant="outline"
              className="border-gray-300 hover:bg-gray-50"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
