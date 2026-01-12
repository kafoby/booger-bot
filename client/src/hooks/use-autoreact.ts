import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface AutoreactConfig {
  id: number;
  guildId: string;
  channelId: string;
  type: "all" | "embed" | "file";
  emojis: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaveAutoreactConfig {
  channelId: string;
  type: "all" | "embed" | "file";
  emojis: string[];
}

export function useAutoreactConfig() {
  return useQuery({
    queryKey: ["/api/autoreact"],
    queryFn: async () => {
      const res = await fetch("/api/autoreact", { credentials: "include" });
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error("Failed to fetch autoreact configuration");
      }
      return res.json() as Promise<AutoreactConfig>;
    },
  });
}

export function useSaveAutoreactConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: SaveAutoreactConfig) => {
      const res = await fetch("/api/autoreact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to save autoreact configuration");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/autoreact"] });
    },
  });
}

export function useDeleteAutoreactConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/autoreact", {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete autoreact configuration");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/autoreact"] });
    },
  });
}
