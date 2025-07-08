import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Search, Filter, FolderOpen, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { googleDrive } from "@/lib/google-drive";
import { format, isToday, isYesterday } from "date-fns";
import { type Receipt } from "@shared/schema";
import { ReceiptModal } from "./receipt-modal";

export function ReceiptGallery() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [dateFilter, setDateFilter] = useState("7days");
  const [sortBy, setSortBy] = useState("newest");

  const { data: receipts = [], isLoading } = useQuery({
    queryKey: ['/api/receipts'],
    queryFn: () => googleDrive.getReceipts(),
  });

  const filteredReceipts = receipts.filter(receipt => {
    if (searchTerm) {
      return receipt.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
             receipt.fileName.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  const groupedReceipts = filteredReceipts.reduce((groups, receipt) => {
    const uploadDate = new Date(receipt.uploadDate!);
    let groupKey: string;
    
    if (isToday(uploadDate)) {
      groupKey = `Today, ${format(uploadDate, 'MMMM d')}`;
    } else if (isYesterday(uploadDate)) {
      groupKey = `Yesterday, ${format(uploadDate, 'MMMM d')}`;
    } else {
      groupKey = format(uploadDate, 'MMMM d, yyyy');
    }
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(receipt);
    return groups;
  }, {} as Record<string, Receipt[]>);

  const handleReceiptClick = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
  };

  const handleOpenInDrive = () => {
    window.open('https://drive.google.com/drive/folders/root', '_blank');
  };

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto px-4">
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="shadow-lg">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="grid grid-cols-3 gap-3">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="h-24 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 animate-fade-in">
      {/* Search and Filter */}
      <Card className="shadow-lg mb-6">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search receipts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="3months">Last 3 months</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="name">By name</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Recent Uploads */}
      <Card className="shadow-lg mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              <Clock className="inline w-5 h-5 text-primary mr-2" />
              Recent Uploads
            </h3>
            <span className="text-sm text-gray-500">{filteredReceipts.length} items</span>
          </div>
          
          <div className="space-y-4">
            {Object.entries(groupedReceipts).map(([dateGroup, receipts]) => (
              <div key={dateGroup} className="border-l-4 border-primary pl-4">
                <h4 className="text-sm font-medium text-gray-600 mb-2">{dateGroup}</h4>
                <div className="grid grid-cols-3 gap-3">
                  {receipts.map((receipt) => (
                    <div
                      key={receipt.id}
                      onClick={() => handleReceiptClick(receipt)}
                      className="receipt-shadow rounded-lg overflow-hidden hover:scale-105 transition-transform cursor-pointer"
                    >
                      {receipt.thumbnailUrl ? (
                        <img
                          src={receipt.thumbnailUrl}
                          alt={receipt.originalName}
                          className="w-full h-24 object-cover"
                        />
                      ) : (
                        <div className="w-full h-24 bg-gray-200 flex items-center justify-center">
                          <Clock className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div className="p-2">
                        <p className="text-xs text-gray-600 truncate">{receipt.originalName}</p>
                        <p className="text-xs text-gray-400">
                          {format(new Date(receipt.uploadDate!), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Folder Structure */}
      <Card className="shadow-lg">
        <CardContent className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            <FolderOpen className="inline w-5 h-5 text-yellow-600 mr-2" />
            Folder Structure
          </h3>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg">
              <FolderOpen className="w-4 h-4 text-yellow-600" />
              <span className="font-medium text-gray-700">receipts</span>
            </div>
            
            <div className="ml-4 flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg">
              <FolderOpen className="w-4 h-4 text-yellow-600" />
              <span className="font-medium text-gray-700">your-folder</span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {receipts.length} receipts
              </span>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Button
              onClick={handleOpenInDrive}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in Google Drive
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedReceipt && (
        <ReceiptModal
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
}
