import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  className?: string;
  onClick?: () => void;
  isActive?: boolean;
  index?: number;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  className,
  onClick,
  isActive,
  index = 0,
}: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.1,
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn(
        "relative overflow-hidden rounded-2xl glass-card p-6 transition-all duration-300 group",
        onClick && "cursor-pointer",
        isActive
          ? "ring-1 ring-white/20 shadow-[0_0_30px_rgba(255,255,255,0.08)]"
          : "hover:shadow-[0_0_40px_rgba(255,255,255,0.05)]",
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Large background icon */}
      <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-500">
        <Icon className="w-28 h-28" />
      </div>

      {/* Shimmer effect on hover */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100"
        initial={false}
      >
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent" />
      </motion.div>

      <div className="flex items-center gap-4 mb-3 relative z-10">
        <motion.div
          className={cn(
            "p-2.5 rounded-xl transition-all duration-300",
            isActive
              ? "bg-white/15 text-white"
              : "bg-white/5 text-white/60 group-hover:bg-white/10 group-hover:text-white/80"
          )}
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <Icon className="w-5 h-5" />
        </motion.div>
        <h3 className="text-xs font-medium text-white/50 tracking-wide">
          {title}
        </h3>
      </div>

      <div className="mt-2 relative z-10">
        <motion.div
          className="text-4xl font-bold font-mono text-gradient tracking-tight"
          key={value}
          initial={{ opacity: 0.5, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {value.toLocaleString()}
        </motion.div>
        {trend && (
          <p className="text-xs text-white/30 mt-2 font-mono tracking-wide">
            {trend}
          </p>
        )}
      </div>

      {/* Active indicator bar */}
      {isActive && (
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-white/30 via-white/50 to-white/30"
          layoutId="activeIndicator"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-white/[0.02] to-transparent rounded-2xl" />
    </motion.div>
  );
}
