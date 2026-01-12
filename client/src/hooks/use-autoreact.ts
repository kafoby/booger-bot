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

export interface CreateAutoreactConfig {
  guildId: string;
  channelId: string;
  type: "all" | "embed" | "file";
  emojis: string[];
}

export interface UpdateAutoreactConfig {
  channelId: string;
  type: "all" | "embed" | "file";
  emojis: string[];
}

export function useAutoreactConfigs() {
  return useQuery({
    queryKey: ["/api/autoreact"],
    queryFn: async () => {
      const res = await fetch("/api/autoreact", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch autoreact configurations");
      return res.json() as Promise<AutoreactConfig[]>;
    },
  });
}

export function useAutoreactConfig(guildId: string | null) {
  return useQuery({
    queryKey: ["/api/autoreact", guildId],
    enabled: !!guildId,
    queryFn: async () => {
      const res = await fetch(`/api/autoreact/${guildId}`, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error("Failed to fetch autoreact configuration");
      }
      return res.json() as Promise<AutoreactConfig>;
    },
  });
}

export function useCreateAutoreactConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateAutoreactConfig) => {
      const res = await fetch("/api/autoreact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create autoreact configuration");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/autoreact"] });
    },
  });
}

export function useUpdateAutoreactConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ guildId, ...data }: UpdateAutoreactConfig & { guildId: string }) => {
      const res = await fetch(`/api/autoreact/${guildId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update autoreact configuration");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/autoreact"] });
      queryClient.invalidateQueries({ queryKey: ["/api/autoreact", variables.guildId] });
    },
  });
}

export function useDeleteAutoreactConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (guildId: string) => {
      const res = await fetch(`/api/autoreact/${guildId}`, {
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
