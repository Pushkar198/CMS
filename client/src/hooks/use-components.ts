import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Component, InsertComponent, PageComponent, InsertPageComponent } from "@shared/schema";

// Component hooks
export const useComponents = () => {
  return useQuery({
    queryKey: ['/api/components'],
    queryFn: () => apiRequest("GET", "/api/components").then(res => res.json() as Promise<Component[]>),
  });
};

export const usePageComponents = (pageId: string) => {
  return useQuery({
    queryKey: ['/api/components/page', pageId],
    queryFn: () => apiRequest("GET", `/api/components/page/${pageId}`).then(res => res.json() as Promise<Component[]>),
  });
};

export const useCreateComponent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (componentData: InsertComponent) => 
      apiRequest("POST", "/api/components", componentData).then(res => res.json() as Promise<Component>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/components'] });
    },
  });
};

export const useDeleteComponent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => 
      apiRequest("DELETE", `/api/components/${id}`).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/components'] });
    },
  });
};

// Page component hooks
export const usePageComponentsList = (pageId: string) => {
  return useQuery({
    queryKey: ['/api/pages', pageId, 'components'],
    queryFn: () => apiRequest("GET", `/api/pages/${pageId}/components`).then(res => res.json() as Promise<PageComponent[]>),
  });
};

export const useAddComponentToPage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ pageId, ...componentData }: InsertPageComponent & { pageId: string }) => 
      apiRequest("POST", `/api/pages/${pageId}/components`, componentData).then(res => res.json() as Promise<PageComponent>),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/pages', variables.pageId, 'components'] });
    },
  });
};

export const useRemoveComponentFromPage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => 
      apiRequest("DELETE", `/api/pages/components/${id}`).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pages'] });
    },
  });
};