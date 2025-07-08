import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, CloudUpload, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { googleDrive } from "@/lib/google-drive";
import { format } from "date-fns";

export function UploadProgress() {
  const { data: recentReceipts = [] } = useQuery({
    queryKey: ['/api/receipts/recent'],
    queryFn: () => googleDrive.getRecentReceipts(1),
  });

  const lastUpload = recentReceipts[0];

  return (
    <Card className="shadow-lg mb-6">
      <CardContent className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          <CloudUpload className="inline w-5 h-5 text-secondary mr-2" />
          Upload Status
        </h3>
        
        <div className="space-y-4">
          {lastUpload ? (
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-secondary" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Receipt uploaded successfully</p>
                <p className="text-xs text-gray-500">
                  {format(new Date(lastUpload.uploadDate!), 'MMM d, yyyy h:mm a')} • {lastUpload.folderPath}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Clock className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">No recent uploads</p>
                <p className="text-xs text-gray-500">Capture your first receipt to get started</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
