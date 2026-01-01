import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SearchPreset, InsertSearchPreset } from "@shared/schema";
import type { AdvancedFilters } from "./use-logs";

export function useSearchPresets() {
  return useQuery({
    queryKey: ["/api/search-presets"],
    queryFn: async () => {
      const res = await fetch("/api/search-presets", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch search presets");
      return await res.json() as SearchPreset[];
    },
  });
}

export function useCreateSearchPreset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; filters: AdvancedFilters }) => {
      const res = await fetch("/api/search-presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create search preset");
      return await res.json() as SearchPreset;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/search-presets"] });
    },
  });
}

export function useDeleteSearchPreset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/search-presets/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete search preset");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/search-presets"] });
    },
  });
}
