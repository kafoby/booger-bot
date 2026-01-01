import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { InsertLog, Log } from "@shared/schema";

interface LogStats {
  total: number;
  error: number;
  warning: number;
  info: number;
}

interface CategoryStats {
  total: number;
  message: number;
  command: number;
  output: number;
  moderation: number;
  system: number;
}

interface LogsResponse {
  logs: Log[];
  stats: LogStats;
  categoryStats: CategoryStats;
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
}

export interface AdvancedFilters {
  level?: string | null;
  search?: string;
  category?: string | null;
  startDate?: string;
  endDate?: string;
  userId?: string;
}

export function useLogs(filters?: AdvancedFilters) {
  const { level, search, category, startDate, endDate, userId } = filters || {};
  return useInfiniteQuery({
    queryKey: [api.logs.list.path, level, search, category, startDate, endDate, userId],
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
      if (category) {
        params.append('category', category);
      }
      if (startDate) {
        console.log('Adding startDate to query:', startDate);
        params.append('startDate', startDate);
      }
      if (endDate) {
        console.log('Adding endDate to query:', endDate);
        params.append('endDate', endDate);
      }
      if (userId && userId.trim()) {
        params.append('userId', userId.trim());
      }
      const url = `${api.logs.list.path}?${params.toString()}`;
      console.log('Fetching logs with URL:', url);
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch logs");
      return await res.json() as LogsResponse;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.offset + lastPage.limit : undefined;
    },
    initialPageParam: 0,
    refetchInterval: 2000, // Poll every 2 seconds for live updates
    refetchOnWindowFocus: true,
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

export function useDeleteLogs() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (category?: string) => {
      const url = category ? `/api/logs?category=${category}` : "/api/logs";
      const res = await fetch(url, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete logs");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.logs.list.path] });
    },
  });
}

export function useDeleteLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/logs/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete log");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.logs.list.path] });
    },
  });
}

export function useBulkDeleteLogs() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: number[]) => {
      const res = await fetch("/api/logs/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to bulk delete logs");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.logs.list.path] });
    },
  });
}
