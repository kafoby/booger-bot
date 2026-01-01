import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, User, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdvancedFilters } from "@/hooks/use-logs";
import { format } from "date-fns";

interface ActiveFiltersProps {
  filters: AdvancedFilters;
  onRemoveFilter: (key: keyof AdvancedFilters) => void;
  onClearAll: () => void;
}

export function ActiveFilters({ filters, onRemoveFilter, onClearAll }: ActiveFiltersProps) {
  const filterChips: Array<{
    key: keyof AdvancedFilters;
    label: string;
    value: string;
    icon: any;
    color: string;
  }> = [];

  if (filters.startDate) {
    try {
      const date = new Date(filters.startDate);
      filterChips.push({
        key: "startDate",
        label: "From",
        value: format(date, "MMM dd, yyyy HH:mm"),
        icon: Calendar,
        color: "blue",
      });
    } catch (e) {
      // Invalid date, skip
    }
  }

  if (filters.endDate) {
    try {
      const date = new Date(filters.endDate);
      filterChips.push({
        key: "endDate",
        label: "To",
        value: format(date, "MMM dd, yyyy HH:mm"),
        icon: Calendar,
        color: "blue",
      });
    } catch (e) {
      // Invalid date, skip
    }
  }

  if (filters.userId) {
    filterChips.push({
      key: "userId",
      label: "User",
      value: filters.userId,
      icon: User,
      color: "purple",
    });
  }

  if (filters.level) {
    filterChips.push({
      key: "level",
      label: "Level",
      value: filters.level,
      icon: AlertCircle,
      color: "red",
    });
  }

  if (filterChips.length === 0) return null;

  const getColorClasses = (color: string) => {
    switch (color) {
      case "blue":
        return {
          bg: "bg-blue-500/10",
          border: "border-blue-500/30",
          text: "text-blue-400",
          hover: "hover:bg-blue-500/20 hover:border-blue-500/40",
        };
      case "purple":
        return {
          bg: "bg-purple-500/10",
          border: "border-purple-500/30",
          text: "text-purple-400",
          hover: "hover:bg-purple-500/20 hover:border-purple-500/40",
        };
      case "red":
        return {
          bg: "bg-red-500/10",
          border: "border-red-500/30",
          text: "text-red-400",
          hover: "hover:bg-red-500/20 hover:border-red-500/40",
        };
      default:
        return {
          bg: "bg-white/5",
          border: "border-white/20",
          text: "text-white/70",
          hover: "hover:bg-white/10 hover:border-white/30",
        };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-wrap items-center gap-2 p-4 rounded-xl bg-white/[0.02] border border-white/10"
    >
      <span className="text-xs font-mono text-white/50 uppercase tracking-wider">Active Filters:</span>
      <AnimatePresence mode="popLayout">
        {filterChips.map((chip) => {
          const colors = getColorClasses(chip.color);
          const Icon = chip.icon;
          return (
            <motion.div
              key={chip.key}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200",
                colors.bg,
                colors.border,
                "group"
              )}
            >
              <Icon className={cn("w-3.5 h-3.5", colors.text)} />
              <span className="text-xs font-mono text-white/80">
                <span className={cn("font-bold", colors.text)}>{chip.label}:</span>{" "}
                {chip.value}
              </span>
              <button
                onClick={() => onRemoveFilter(chip.key)}
                className={cn(
                  "p-0.5 rounded hover:bg-white/10 transition-all duration-200",
                  colors.text,
                  "opacity-60 group-hover:opacity-100"
                )}
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={onClearAll}
        className="ml-auto px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/40 rounded-lg transition-all duration-200"
      >
        Clear All
      </motion.button>
    </motion.div>
  );
}
