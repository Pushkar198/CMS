import { Button } from "@/components/ui/button";
import { Eye, Plus, Trash2, FileText } from "lucide-react";
import type { Media } from "@shared/schema";

interface MediaGridProps {
  media: Media[];
  onDeleteMedia: (id: string, filename: string) => void;
}

export default function MediaGrid({ media, onDeleteMedia }: MediaGridProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return null; // Show actual image
    }
    return <FileText className="h-8 w-8 text-slate-400" />;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-6">
      {media.map((file) => (
        <div
          key={file.id}
          className="group relative bg-white rounded-lg border border-slate-200 p-3 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="aspect-square bg-slate-100 rounded-lg mb-3 overflow-hidden flex items-center justify-center">
            {file.mimeType.startsWith('image/') ? (
              <img
                src={`/api/media/file/${file.filename}`}
                alt={file.originalName}
                className="w-full h-full object-cover"
              />
            ) : (
              getFileIcon(file.mimeType)
            )}
          </div>
          <p className="text-sm font-medium text-slate-900 truncate mb-1">
            {file.originalName}
          </p>
          <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>

          {/* Hover Actions */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
            <Button size="sm" variant="secondary" className="w-8 h-8 p-0">
              <Eye className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="secondary" className="w-8 h-8 p-0">
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="w-8 h-8 p-0"
              onClick={() => onDeleteMedia(file.id, file.originalName)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
