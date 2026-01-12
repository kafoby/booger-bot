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

export interface CreateStarboardConfig {
  guildId: string;
  monitoredChannelId: string;
  emoji: string;
  threshold: number;
  starboardChannelId: string;
}

export interface UpdateStarboardConfig {
  monitoredChannelId: string;
  emoji: string;
  threshold: number;
  starboardChannelId: string;
}

export function useStarboardConfigs() {
  return useQuery({
    queryKey: ["/api/starboard"],
    queryFn: async () => {
      const res = await fetch("/api/starboard", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch starboard configurations");
      return res.json() as Promise<StarboardConfig[]>;
    },
  });
}

export function useStarboardConfig(guildId: string | null) {
  return useQuery({
    queryKey: ["/api/starboard", guildId],
    enabled: !!guildId,
    queryFn: async () => {
      const res = await fetch(`/api/starboard/${guildId}`, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error("Failed to fetch starboard configuration");
      }
      return res.json() as Promise<StarboardConfig>;
    },
  });
}

export function useCreateStarboardConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateStarboardConfig) => {
      const res = await fetch("/api/starboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create starboard configuration");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/starboard"] });
    },
  });
}

export function useUpdateStarboardConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ guildId, ...data }: UpdateStarboardConfig & { guildId: string }) => {
      const res = await fetch(`/api/starboard/${guildId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update starboard configuration");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/starboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/starboard", variables.guildId] });
    },
  });
}

export function useDeleteStarboardConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (guildId: string) => {
      const res = await fetch(`/api/starboard/${guildId}`, {
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
