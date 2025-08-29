import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMedia, useUploadMedia, useDeleteMedia } from "@/hooks/use-media";
import UploadZone from "@/components/media/upload-zone";
import MediaGrid from "@/components/media/media-grid";
import { Search, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function MediaLibrary() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const { data: media, isLoading } = useMedia(search);
  const { mutate: uploadMedia, isPending: isUploading } = useUploadMedia();
  const { mutate: deleteMedia } = useDeleteMedia();
  const { toast } = useToast();

  const filteredMedia = media?.filter(item => {
    if (typeFilter === "all") return true;
    if (typeFilter === "images") return item.mimeType.startsWith('image/');
    if (typeFilter === "documents") return item.mimeType === 'application/pdf';
    return false;
  });

  const handleFileUpload = (files: FileList) => {
    uploadMedia(files, {
      onSuccess: (uploadedFiles) => {
        toast({
          title: "Upload successful",
          description: `${uploadedFiles.length} file(s) uploaded successfully.`,
        });
      },
      onError: (error) => {
        toast({
          title: "Upload failed",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };

  const handleDeleteMedia = (id: string, filename: string) => {
    if (window.confirm(`Are you sure you want to delete "${filename}"?`)) {
      deleteMedia(id, {
        onSuccess: () => {
          toast({
            title: "File deleted",
            description: `"${filename}" has been deleted successfully.`,
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to delete file.",
            variant: "destructive",
          });
        }
      });
    }
  };

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 font-inter">Media Library</h1>
            <p className="text-slate-500 mt-1">Manage images, icons, and other assets</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Input
                placeholder="Search media..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="images">Images</SelectItem>
                <SelectItem value="documents">Documents</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <div className="flex-1 p-6 overflow-y-auto">
        {/* Upload Area */}
        <UploadZone onFileUpload={handleFileUpload} isUploading={isUploading} />

        {/* Media Grid */}
        {isLoading ? (
          <div className="text-center py-8">Loading media...</div>
        ) : !filteredMedia || filteredMedia.length === 0 ? (
          <Card className="mt-6">
            <CardContent className="p-8 text-center">
              <h3 className="text-lg font-medium text-slate-900 mb-2">No media files found</h3>
              <p className="text-slate-500">
                {search || typeFilter !== "all" 
                  ? "No files match your search criteria." 
                  : "Upload some files to get started."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <MediaGrid 
            media={filteredMedia} 
            onDeleteMedia={handleDeleteMedia}
          />
        )}
      </div>
    </>
  );
}
