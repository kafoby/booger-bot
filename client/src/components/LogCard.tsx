import { motion } from "framer-motion";
import { format } from "date-fns";
import { AlertTriangle, AlertCircle, Info, Trash2, Check, ChevronRight } from "lucide-react";
import type { Log } from "@shared/schema";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteLog } from "@/hooks/use-logs";
import { useConfig } from "@/hooks/use-config";
import { useToast } from "@/hooks/use-toast";

interface LogCardProps {
  log: Log;
  index: number;
  isSelected?: boolean;
  isSelectionMode?: boolean;
  onToggleSelection?: (id: number) => void;
}

export function LogCard({ log, index, isSelected = false, isSelectionMode = false, onToggleSelection }: LogCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const deleteLog = useDeleteLog();
  const { data: configData } = useConfig();
  const { toast } = useToast();

  const isAdmin = configData?.isAdmin || false;

  const handleDelete = async () => {
    try {
      await deleteLog.mutateAsync(log.id);
      toast({
        title: "Log Deleted",
        description: "Log entry has been removed.",
      });
      setIsDeleteDialogOpen(false);
    } catch (e) {
      toast({
        title: "Deletion Failed",
        description: "Could not delete log entry.",
        variant: "destructive",
      });
    }
  };

  const getLevelConfig = (level: string) => {
    switch (level.toLowerCase()) {
      case "error":
        return {
          icon: AlertCircle,
          accent: "border-red-400/40",
          bg: "hover:bg-red-500/5",
          text: "text-red-400",
          badge: "bg-red-500/15 text-red-400 border-red-500/30",
          iconBg: "bg-red-500/10",
        };
      case "warning":
      case "warn":
        return {
          icon: AlertTriangle,
          accent: "border-amber-400/40",
          bg: "hover:bg-amber-500/5",
          text: "text-amber-400",
          badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
          iconBg: "bg-amber-500/10",
        };
      case "info":
        return {
          icon: Info,
          accent: "border-blue-400/40",
          bg: "hover:bg-blue-500/5",
          text: "text-blue-400",
          badge: "bg-blue-500/15 text-blue-400 border-blue-500/30",
          iconBg: "bg-blue-500/10",
        };
      default:
        return {
          icon: Info,
          accent: "border-white/20",
          bg: "hover:bg-white/5",
          text: "text-white/60",
          badge: "bg-white/10 text-white/60 border-white/20",
          iconBg: "bg-white/5",
        };
    }
  };

  const config = getLevelConfig(log.level);
  const Icon = config.icon;

  // Terminal-style compact design
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: Math.min(index * 0.02, 0.3),
          duration: 0.25,
        }}
        className={cn(
          "group relative border-l-2 pl-3 pr-3 py-2.5 transition-all duration-200",
          config.accent,
          config.bg,
          "hover:border-l-[3px] hover:pl-[11px]",
          isSelected && "bg-purple-500/10 border-purple-500/50"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Subtle background on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

        <div className="relative flex items-start gap-3">
          {/* Selection checkbox - compact */}
          {isAdmin && isSelectionMode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelection?.(log.id);
              }}
              className={cn(
                "flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-all duration-150 mt-0.5",
                isSelected
                  ? "bg-purple-500 border-purple-500"
                  : "border-white/20 hover:border-purple-400/50"
              )}
            >
              {isSelected && <Check className="w-3 h-3 text-black" />}
            </button>
          )}

          {/* Compact icon indicator */}
          <div className={cn("flex-shrink-0 w-5 h-5 rounded flex items-center justify-center mt-0.5", config.iconBg)}>
            <Icon className={cn("w-3 h-3", config.text)} />
          </div>

          {/* Main content - inline terminal style */}
          <div className="flex-1 min-w-0 font-mono text-[13px] leading-relaxed">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              {/* Timestamp - compact */}
              <span className="text-white/40 text-[11px] tabular-nums shrink-0">
                {log.timestamp ? format(new Date(log.timestamp), "HH:mm:ss") : "--:--:--"}
              </span>

              {/* Level badge - mini */}
              <span className={cn(
                "text-[9px] px-1.5 py-0.5 rounded border uppercase font-semibold tracking-wide shrink-0",
                config.badge
              )}>
                {log.level}
              </span>

              {/* Chevron indicator for expandable */}
              <ChevronRight className={cn(
                "w-3 h-3 text-white/20 transition-transform duration-200 shrink-0",
                isExpanded && "rotate-90"
              )} />

              {/* Message - inline, truncated on one line unless expanded */}
              <span className={cn(
                "text-white/70 group-hover:text-white/85 transition-colors flex-1",
                !isExpanded && "truncate"
              )}>
                {log.message}
              </span>
            </div>

            {/* Expanded view - shows full message and metadata */}
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-2 pt-2 border-t border-white/5"
              >
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex gap-2">
                    <span className="text-white/30 w-16 shrink-0">Date:</span>
                    <span className="text-white/50">
                      {log.timestamp && format(new Date(log.timestamp), "MMM dd, yyyy")}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-white/30 w-16 shrink-0">ID:</span>
                    <span className="text-white/40">#{log.id}</span>
                  </div>
                  {log.category && (
                    <div className="flex gap-2">
                      <span className="text-white/30 w-16 shrink-0">Category:</span>
                      <span className="text-white/50">{log.category}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Delete button - minimal */}
          {isAdmin && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsDeleteDialogOpen(true);
              }}
              className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded hover:bg-red-500/20 mt-0.5"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400/70 hover:text-red-400" />
            </button>
          )}
        </div>

        {/* Subtle divider line between logs */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="glass-card border-white/10 rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-xl text-gradient flex items-center gap-3">
              <div className={cn("p-2 rounded-lg border", config.iconBg, config.badge)}>
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              Delete Log Entry
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/60 text-sm pt-4">
              Are you sure you want to delete this log entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <div className="glass p-3 rounded-xl border border-white/10">
              <div className="flex items-start gap-2.5">
                <div className={cn("flex-shrink-0 w-6 h-6 rounded flex items-center justify-center", config.iconBg)}>
                  <Icon className={cn("w-3.5 h-3.5", config.text)} />
                </div>
                <div className="flex-1 min-w-0 font-mono text-xs">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn("text-[9px] px-1.5 py-0.5 rounded border uppercase font-semibold", config.badge)}>
                      {log.level}
                    </span>
                    <span className="text-white/40 text-[10px]">
                      {log.timestamp && format(new Date(log.timestamp), "MMM dd, HH:mm:ss")}
                    </span>
                  </div>
                  <p className="text-white/60 break-words">
                    {log.message}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="border-white/10 hover:bg-white/5 text-white/60 rounded-xl">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLog.isPending}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 hover:border-red-500/40 rounded-xl"
            >
              {deleteLog.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
