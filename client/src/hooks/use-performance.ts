import { useQuery } from "@tanstack/react-query";

interface PerformanceMetrics {
  commandsPerHour: { hour: string; count: number }[];
  categoryBreakdown: { category: string; count: number; percentage: number }[];
  errorRate: { total: number; errors: number; percentage: number };
  recentActivity: { timestamp: string; count: number }[];
  topCommands: { command: string; count: number }[];
}

export function usePerformance() {
  return useQuery({
    queryKey: ["/api/performance"],
    queryFn: async () => {
      const res = await fetch("/api/performance", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch performance metrics");
      return res.json() as Promise<PerformanceMetrics>;
    },
    refetchInterval: 30000, // Poll every 30 seconds
  });
}
