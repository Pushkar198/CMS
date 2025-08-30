import { useMutation, useQueryClient } from "@tanstack/react-query";

export interface WebsiteImportData {
  projectName?: string;
}

export function useImportWebsite() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { file: File; importData: WebsiteImportData }) => {
      const formData = new FormData();
      formData.append('websiteFile', data.file);
      
      // Add metadata
      if (data.importData.projectName) {
        formData.append('projectName', data.importData.projectName);
      }
      
      const res = await fetch('/api/import-website', {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || `Import failed: ${res.statusText}`);
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });
}