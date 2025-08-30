import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface HTMLUploadData {
  name?: string;
  pageType?: string;
  state?: string;
}

export function useUploadHTML() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { file: File; uploadData: HTMLUploadData }) => {
      const formData = new FormData();
      formData.append('htmlFile', data.file);
      
      // Add metadata
      if (data.uploadData.name) formData.append('name', data.uploadData.name);
      if (data.uploadData.pageType) formData.append('pageType', data.uploadData.pageType);
      if (data.uploadData.state) formData.append('state', data.uploadData.state);
      
      const res = await fetch('/api/html-to-page', {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || `Upload failed: ${res.statusText}`);
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });
}