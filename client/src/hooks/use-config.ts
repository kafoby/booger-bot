import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface BotConfig {
  id: number;
  prefix: string;
  disabledCommands: string[] | null;
  allowedChannels: string[] | null;
  updatedAt: string;
  updatedBy: string | null;
}

interface ConfigResponse {
  config: BotConfig;
  isAdmin: boolean;
}

interface AdminUser {
  id: number;
  discordId: string;
  addedAt: string;
  addedBy: string | null;
}

interface AdminsResponse {
  admins: AdminUser[];
  defaultAdmins: string[];
  allAdminIds: string[];
}

export function useConfig() {
  return useQuery({
    queryKey: ["/api/config"],
    queryFn: async () => {
      const res = await fetch("/api/config", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch config");
      return res.json() as Promise<ConfigResponse>;
    },
  });
}

export function useUpdateConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<BotConfig>) => {
      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update config");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/config"] });
    },
  });
}

export function useAdmins() {
  return useQuery({
    queryKey: ["/api/admins"],
    queryFn: async () => {
      const res = await fetch("/api/admins", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch admins");
      return res.json() as Promise<AdminsResponse>;
    },
  });
}

export function useAddAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (discordId: string) => {
      const res = await fetch("/api/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discordId }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to add admin");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admins"] });
    },
  });
}

export function useRemoveAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (discordId: string) => {
      const res = await fetch(`/api/admins/${discordId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to remove admin");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admins"] });
    },
  });
}
