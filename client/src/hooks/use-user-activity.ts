import { useQuery } from "@tanstack/react-query";

interface UserActivity {
  topUsers: { username: string; count: number; percentage: number }[];
  userTimeline: { date: string; count: number }[];
  commandsByUser: { username: string; commands: number; messages: number }[];
  activityByCategory: { username: string; category: string; count: number }[];
}

export function useUserActivity() {
  return useQuery({
    queryKey: ["/api/analytics/users"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/users", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch user activity");
      return res.json() as Promise<UserActivity>;
    },
    refetchInterval: 30000, // Poll every 30 seconds
  });
}
