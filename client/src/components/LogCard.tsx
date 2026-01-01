import { motion } from "framer-motion";
import { format } from "date-fns";
import { AlertTriangle, AlertCircle, Info, Circle, Trash2, Check } from "lucide-react";
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
          bgColor: "bg-red-500/10",
          borderColor: "border-red-500/20",
          textColor: "text-red-400",
          glowColor: "shadow-[0_0_20px_rgba(239,68,68,0.1)]",
          dotColor: "bg-red-400",
        };
      case "warning":
      case "warn":
        return {
          icon: AlertTriangle,
          bgColor: "bg-amber-500/10",
          borderColor: "border-amber-500/20",
          textColor: "text-amber-400",
          glowColor: "shadow-[0_0_20px_rgba(245,158,11,0.1)]",
          dotColor: "bg-amber-400",
        };
      default:
        return {
          icon: Info,
          bgColor: "bg-blue-500/10",
          borderColor: "border-blue-500/20",
          textColor: "text-blue-400",
          glowColor: "shadow-[0_0_20px_rgba(59,130,246,0.1)]",
          dotColor: "bg-blue-400",
        };
    }
  };

  const config = getLevelConfig(log.level);
  const Icon = config.icon;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -30, scale: 0.98 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{
          delay: Math.min(index * 0.03, 0.5),
          duration: 0.4,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        whileHover={{ x: 4, transition: { duration: 0.2 } }}
        className={cn(
          "group relative flex items-start gap-4 p-4 rounded-xl",
          "bg-white/[0.02] border border-white/5",
          "hover:bg-white/[0.04] hover:border-white/10",
          "transition-all duration-300",
          config.glowColor,
          isSelected && "border-purple-500/30 bg-purple-500/5"
        )}
      >
      {/* Timeline connector */}
      <div className={cn(
        "absolute top-14 bottom-[-8px] w-px bg-gradient-to-b from-white/10 to-transparent group-last:hidden",
        isSelectionMode ? "left-[56px]" : "left-[27px]"
      )} />

      {/* Selection checkbox - only for admins */}
      {isAdmin && isSelectionMode && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelection?.(log.id);
          }}
          className={cn(
            "flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200",
            isSelected
              ? "bg-purple-500 border-purple-500 shadow-lg shadow-purple-500/20"
              : "border-white/20 hover:border-purple-500/50 hover:bg-white/5"
          )}
        >
          {isSelected && <Check className="w-3.5 h-3.5 text-black" />}
        </motion.button>
      )}

      {/* Level indicator with animation */}
      <motion.div
        className={cn(
          "flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center border relative overflow-hidden",
          config.bgColor,
          config.borderColor
        )}
        whileHover={{ scale: 1.1 }}
        transition={{ duration: 0.2 }}
      >
        {/* Subtle pulse animation */}
        <motion.div
          className={cn("absolute inset-0", config.bgColor)}
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <Icon className={cn("w-4 h-4 relative z-10", config.textColor)} />
      </motion.div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1.5">
          {/* Level badge */}
          <span
            className={cn(
              "text-[10px] font-mono px-2 py-0.5 rounded-md uppercase tracking-wider font-bold",
              "bg-white/5 border border-white/10",
              config.textColor
            )}
          >
            {log.level}
          </span>

          {/* Timestamp */}
          <span className="text-xs text-white/30 font-mono flex items-center gap-1.5">
            <Circle className="w-1 h-1 fill-current" />
            {log.timestamp
              ? format(new Date(log.timestamp), "HH:mm:ss.SSS")
              : "--:--:--"}
          </span>

          {/* Date (shown on hover) */}
          <span className="text-xs text-white/20 font-mono opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {log.timestamp && format(new Date(log.timestamp), "MMM dd, yyyy")}
          </span>
        </div>

        {/* Message with hover highlight */}
        <p className="text-sm md:text-base font-mono leading-relaxed text-white/70 group-hover:text-white/90 transition-colors duration-300 break-words">
          {log.message}
        </p>
      </div>

      {/* Admin Delete Button */}
      {isAdmin && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20"
          onClick={(e) => {
            e.stopPropagation();
            setIsDeleteDialogOpen(true);
          }}
        >
          <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30 transition-all duration-200 shadow-lg shadow-red-500/20">
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
          </div>
        </motion.button>
      )}

      {/* Right side accent line */}
      <div
        className={cn(
          "absolute right-0 top-4 bottom-4 w-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          config.dotColor
        )}
      />
    </motion.div>

    {/* Delete Confirmation Dialog */}
    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <AlertDialogContent className="bg-zinc-900 border-red-500/20 rounded-2xl max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-xl text-gradient flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            Delete Log Entry
          </AlertDialogTitle>
          <AlertDialogDescription className="text-white/60 text-sm pt-4">
            Are you sure you want to delete this log entry? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <div className="glass-card p-4 rounded-xl bg-white/[0.02] border border-white/10">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border mt-0.5",
                  config.bgColor,
                  config.borderColor
                )}
              >
                <Icon className={cn("w-4 h-4", config.textColor)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn("text-[10px] font-mono px-2 py-0.5 rounded-md uppercase tracking-wider font-bold bg-white/5 border border-white/10", config.textColor)}>
                    {log.level}
                  </span>
                  <span className="text-[10px] text-white/30 font-mono">
                    {log.timestamp && format(new Date(log.timestamp), "MMM dd, HH:mm:ss")}
                  </span>
                </div>
                <p className="text-xs font-mono text-white/60 break-words line-clamp-2">
                  {log.message}
                </p>
              </div>
            </div>
          </div>
        </div>
        <AlertDialogFooter className="gap-3">
          <AlertDialogCancel className="font-mono border-white/10 hover:bg-white/5 text-white/60 rounded-xl">
            CANCEL
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteLog.isPending}
            className="font-mono bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 hover:border-red-500/40 rounded-xl"
          >
            {deleteLog.isPending ? "DELETING..." : "DELETE"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
