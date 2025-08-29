import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Page, InsertPage } from "@shared/schema";

export function usePages() {
  return useQuery<Page[]>({
    queryKey: ["/api/pages"],
  });
}

export function usePage(id: string) {
  return useQuery<Page>({
    queryKey: ["/api/pages", id],
  });
}

export function useCreatePage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: InsertPage) => {
      const res = await apiRequest("POST", "/api/pages", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pages"] });
    },
  });
}

export function useUpdatePage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertPage> }) => {
      const res = await apiRequest("PUT", `/api/pages/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pages"] });
    },
  });
}

export function useDeletePage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/pages/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pages"] });
    },
  });
}

export function useUpdatePageState() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, state }: { id: string; state: 'Draft' | 'Live' | 'Expired' }) => {
      const res = await apiRequest("PATCH", `/api/pages/${id}/state`, { state });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });
}

export interface Stats {
  totalPages: number;
  livePages: number;
  draftPages: number;
  expiredPages: number;
  mediaFiles: number;
}

export function useStats() {
  return useQuery<Stats>({
    queryKey: ["/api/stats"],
  });
}
