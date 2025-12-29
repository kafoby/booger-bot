import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  className?: string;
  onClick?: () => void;
  isActive?: boolean;
}

export function StatsCard({ title, value, icon: Icon, trend, className, onClick, isActive }: StatsCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border/50 bg-card/50 p-6 backdrop-blur-xl transition-all duration-300",
        onClick && "cursor-pointer hover:scale-105",
        isActive ? "ring-2 ring-primary shadow-[0_0_20px_rgba(74,222,128,0.15)] border-primary/50" : "hover:border-primary/30 hover:shadow-[0_0_20px_rgba(74,222,128,0.05)]",
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
    >
      <div className="absolute top-0 right-0 p-4 opacity-5">
        <Icon className="w-24 h-24" />
      </div>

      <div className="flex items-center gap-4 mb-2">
        <div className={cn(
          "p-2 rounded-lg",
          isActive ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
        )}>
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">{title}</h3>
      </div>

      <div className="mt-2">
        <div className="text-3xl font-bold font-mono text-foreground tracking-tight">
          {value}
        </div>
        {trend && (
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            {trend}
          </p>
        )}
      </div>

      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary animate-pulse" />
      )}
    </div>
  );
}
