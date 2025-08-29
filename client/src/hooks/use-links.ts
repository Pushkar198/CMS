import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Link, InsertLink } from "@shared/schema";

// Link hooks for page navigation flows
export const useLinks = () => {
  return useQuery({
    queryKey: ['/api/links'],
    queryFn: () => apiRequest("GET", "/api/links").then(res => res.json() as Promise<Link[]>),
  });
};

export const usePageLinks = (pageId: string) => {
  return useQuery({
    queryKey: ['/api/links/page', pageId],
    queryFn: () => apiRequest("GET", `/api/links/page/${pageId}`).then(res => res.json() as Promise<Link[]>),
    enabled: !!pageId,
  });
};

export const useCreateLink = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (linkData: InsertLink) => 
      apiRequest("POST", "/api/links", linkData).then(res => res.json() as Promise<Link>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/links'] });
    },
  });
};

export const useDeleteLink = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => 
      apiRequest("DELETE", `/api/links/${id}`).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/links'] });
    },
  });
};