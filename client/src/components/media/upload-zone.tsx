import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { CloudUpload } from "lucide-react";

interface UploadZoneProps {
  onFileUpload: (files: FileList) => void;
  isUploading?: boolean;
}

export default function UploadZone({ onFileUpload, isUploading }: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileUpload(e.dataTransfer.files);
    }
  }, [onFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files);
    }
  }, [onFileUpload]);

  return (
    <div 
      className={`bg-slate-50 border-2 border-dashed rounded-xl p-8 text-center mb-6 transition-colors ${
        isDragOver ? 'border-primary bg-primary/5' : 'border-slate-300'
      } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <CloudUpload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-slate-900 mb-2">
        {isUploading ? 'Uploading files...' : 'Drop files here to upload'}
      </h3>
      <p className="text-slate-500 mb-4">or click to browse your computer</p>
      <input
        type="file"
        multiple
        onChange={handleFileInput}
        className="hidden"
        id="file-upload"
        accept="image/*,application/pdf"
        disabled={isUploading}
      />
      <label htmlFor="file-upload">
        <Button asChild className="cursor-pointer" disabled={isUploading}>
          <span>Browse Files</span>
        </Button>
      </label>
      <p className="text-sm text-slate-400 mt-3">
        Supports: JPG, PNG, GIF, SVG, PDF (Max 10MB)
      </p>
    </div>
  );
}
