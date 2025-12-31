import { motion } from "framer-motion";
import { format } from "date-fns";
import { AlertTriangle, AlertCircle, Info, Circle } from "lucide-react";
import type { Log } from "@shared/schema";
import { cn } from "@/lib/utils";

interface LogCardProps {
  log: Log;
  index: number;
}

export function LogCard({ log, index }: LogCardProps) {
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
        config.glowColor
      )}
    >
      {/* Timeline connector */}
      <div className="absolute left-[27px] top-14 bottom-[-8px] w-px bg-gradient-to-b from-white/10 to-transparent group-last:hidden" />

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

      {/* Right side accent line */}
      <div
        className={cn(
          "absolute right-0 top-4 bottom-4 w-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          config.dotColor
        )}
      />
    </motion.div>
  );
}
