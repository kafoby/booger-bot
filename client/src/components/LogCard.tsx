import { motion } from "framer-motion";
import { format } from "date-fns";
import { Terminal, AlertTriangle, AlertCircle, Info } from "lucide-react";
import type { Log } from "@shared/schema";
import { cn } from "@/lib/utils";

interface LogCardProps {
  log: Log;
  index: number;
}

export function LogCard({ log, index }: LogCardProps) {
  const getLevelStyles = (level: string) => {
    switch (level.toLowerCase()) {
      case "error":
        return "text-red-400 bg-red-400/10 border-red-400/20 shadow-[0_0_10px_rgba(248,113,113,0.1)]";
      case "warning":
      case "warn":
        return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20 shadow-[0_0_10px_rgba(250,204,21,0.1)]";
      default:
        return "text-primary bg-primary/10 border-primary/20 shadow-[0_0_10px_rgba(74,222,128,0.1)]";
    }
  };

  const getIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case "error":
        return <AlertCircle className="w-4 h-4" />;
      case "warning":
      case "warn":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={cn(
        "group relative flex items-start gap-4 p-4 rounded-lg border backdrop-blur-sm",
        "hover:bg-muted/30 transition-all duration-200",
        "border-border/40 hover:border-border/80"
      )}
    >
      {/* Connector Line */}
      <div className="absolute left-[27px] top-8 bottom-[-16px] w-px bg-border/40 group-last:hidden" />

      {/* Level Indicator */}
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border",
        getLevelStyles(log.level)
      )}>
        {getIcon(log.level)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <span className={cn(
            "text-xs font-mono px-2 py-0.5 rounded uppercase tracking-wider font-bold border",
            getLevelStyles(log.level).split(' ')[0], // Get text color
            "bg-transparent border-current opacity-80"
          )}>
            {log.level}
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            {log.timestamp ? format(new Date(log.timestamp), "HH:mm:ss.SSS") : "--:--:--"}
          </span>
        </div>
        
        <p className="text-sm md:text-base font-mono leading-relaxed text-foreground/90 break-words">
          {log.message}
        </p>
      </div>
    </motion.div>
  );
}
