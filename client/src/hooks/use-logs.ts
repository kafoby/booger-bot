import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { InsertLog, Log } from "@shared/schema";

interface LogStats {
  total: number;
  error: number;
  warning: number;
  info: number;
}

interface LogsResponse {
  logs: Log[];
  stats: LogStats;
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
}

export function useLogs(level?: string | null, search?: string) {
  return useInfiniteQuery({
    queryKey: [api.logs.list.path, level, search],
    queryFn: async ({ pageParam = 0 }) => {
      const params = new URLSearchParams({
        limit: '100',
        offset: pageParam.toString(),
      });
      if (level) {
        params.append('level', level);
      }
      if (search && search.trim()) {
        params.append('search', search.trim());
      }
      const res = await fetch(
        `${api.logs.list.path}?${params.toString()}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to fetch logs");
      return await res.json() as LogsResponse;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.offset + lastPage.limit : undefined;
    },
    initialPageParam: 0,
    refetchInterval: 30000, // Reduced to 30s to avoid excessive requests
  });
}

export function useCreateLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertLog) => {
      const res = await fetch(api.logs.create.path, {
        method: api.logs.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create log");
      return api.logs.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.logs.list.path] });
    },
  });
}
