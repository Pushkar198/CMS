import { useQuery } from "@tanstack/react-query";
import type { Generation } from "@shared/schema";

export function useGenerations() {
  return useQuery<Generation[]>({
    queryKey: ["/api/generations"],
  });
}