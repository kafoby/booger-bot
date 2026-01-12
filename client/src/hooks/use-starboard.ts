import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface StarboardConfig {
  id: number;
  guildId: string;
  monitoredChannelId: string;
  emoji: string;
  threshold: number;
  starboardChannelId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaveStarboardConfig {
  monitoredChannelId: string;
  emoji: string;
  threshold: number;
  starboardChannelId: string;
}

export function useStarboardConfig() {
  return useQuery({
    queryKey: ["/api/starboard"],
    queryFn: async () => {
      const res = await fetch("/api/starboard", { credentials: "include" });
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error("Failed to fetch starboard configuration");
      }
      return res.json() as Promise<StarboardConfig>;
    },
  });
}

export function useSaveStarboardConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: SaveStarboardConfig) => {
      const res = await fetch("/api/starboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to save starboard configuration");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/starboard"] });
    },
  });
}

export function useDeleteStarboardConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/starboard", {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete starboard configuration");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/starboard"] });
    },
  });
}
