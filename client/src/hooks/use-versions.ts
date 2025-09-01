import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface PageVersion {
  id: string;
  pageId: string;
  versionNumber: number;
  name: string;
  html: string;
  css: string;
  js: string;
  state: string;
  changeDescription: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface RollbackRequest {
  pageId: string;
  versionId: string;
}

export interface RollbackResponse {
  success: boolean;
  page: any;
  message: string;
}

// Fetch page versions
async function fetchPageVersions(pageId: string): Promise<PageVersion[]> {
  const response = await fetch(`/api/pages/${pageId}/versions`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch page versions');
  }
  
  return response.json();
}

// Fetch specific version
async function fetchVersion(versionId: string): Promise<PageVersion> {
  const response = await fetch(`/api/versions/${versionId}`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch version');
  }
  
  return response.json();
}

// Rollback to version
async function rollbackToVersion({ pageId, versionId }: RollbackRequest): Promise<RollbackResponse> {
  const response = await fetch(`/api/pages/${pageId}/rollback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ versionId }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to rollback to version');
  }
  
  return response.json();
}

// Hook to fetch page versions
export function usePageVersions(pageId: string | undefined) {
  return useQuery({
    queryKey: ['pageVersions', pageId],
    queryFn: () => fetchPageVersions(pageId!),
    enabled: !!pageId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Hook to fetch specific version
export function useVersion(versionId: string | undefined) {
  return useQuery({
    queryKey: ['version', versionId],
    queryFn: () => fetchVersion(versionId!),
    enabled: !!versionId,
  });
}

// Hook to rollback to version
export function useRollbackToVersion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: rollbackToVersion,
    onSuccess: (data, variables) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['pages'] });
      queryClient.invalidateQueries({ queryKey: ['pageVersions', variables.pageId] });
      queryClient.invalidateQueries({ queryKey: ['pages', 'pending-approval'] });
    },
  });
}