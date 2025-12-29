import { useQuery } from "@tanstack/react-query";

interface BotStatusResponse {
  id?: number;
  status: string;
  lastHeartbeat: string | null;
  uptime: string | null;
  startedAt: string | null;
  errorMessage: string | null;
  isOnline: boolean;
  lastSeenText: string;
}

export function useBotStatus() {
  return useQuery({
    queryKey: ["/api/bot/status"],
    queryFn: async () => {
      const res = await fetch("/api/bot/status", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch bot status");
      return res.json() as Promise<BotStatusResponse>;
    },
    refetchInterval: 15000, // Poll every 15 seconds
  });
}
