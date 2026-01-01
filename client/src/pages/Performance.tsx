import { Header } from "@/components/Header";
import { usePerformance } from "@/hooks/use-performance";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  AlertOctagon,
  BarChart3,
  TrendingUp,
  Zap,
  Clock,
  Terminal,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function Performance() {
  const { data: metrics, isLoading, error, refetch } = usePerformance();

  const statCards = [
    {
      title: "Total Events",
      value: metrics?.errorRate.total.toLocaleString() || "0",
      icon: Activity,
      gradient: "from-blue-500/20 to-cyan-500/20",
      color: "text-blue-400",
    },
    {
      title: "Error Rate",
      value: `${metrics?.errorRate.percentage.toFixed(2) || "0"}%`,
      icon: AlertOctagon,
      gradient: "from-red-500/20 to-rose-500/20",
      color: "text-red-400",
    },
    {
      title: "Commands Tracked",
      value: metrics?.topCommands.length.toLocaleString() || "0",
      icon: Terminal,
      gradient: "from-emerald-500/20 to-green-500/20",
      color: "text-emerald-400",
    },
    {
      title: "Active Hours",
      value: metrics?.commandsPerHour.length.toLocaleString() || "0",
      icon: Clock,
      gradient: "from-purple-500/20 to-pink-500/20",
      color: "text-purple-400",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="fixed inset-0 z-0 opacity-30">
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10"
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%"],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
      </div>

      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 space-y-8 relative z-10">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold text-gradient font-display mb-2">
              Performance Metrics
            </h1>
            <p className="text-white/40 font-mono text-sm">
              Real-time bot performance analytics and insights
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="font-mono text-xs gap-2 border-white/10 hover:border-white/20 hover:bg-white/5 text-white/60 hover:text-white/90 transition-all duration-300 rounded-xl px-4 py-2.5"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
            REFRESH
          </Button>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className={cn(
                  "glass-card rounded-2xl p-6 bg-gradient-to-br",
                  card.gradient,
                  "border border-white/10 relative overflow-hidden group"
                )}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-white/[0.02]" />
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn("w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center", card.color)}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className={cn("w-2 h-2 rounded-full", card.color)}
                    />
                  </div>
                  <div className="text-xs uppercase tracking-wider text-white/40 font-mono mb-2">
                    {card.title}
                  </div>
                  <div className={cn("text-3xl font-bold font-mono", card.color)}>
                    {isLoading ? "..." : card.value}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {error ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-8 space-y-6 glass-card rounded-2xl">
            <motion.div
              className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <AlertOctagon className="w-10 h-10 text-red-400" />
            </motion.div>
            <div>
              <h3 className="text-xl font-bold text-gradient font-display mb-2">
                Data Unavailable
              </h3>
              <p className="text-white/40 font-mono max-w-sm">
                Unable to load performance metrics. Please try again.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Commands Per Hour */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="glass-card rounded-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white/90 font-display">
                      Commands Per Hour
                    </h2>
                    <p className="text-xs text-white/40 font-mono">Last 24 hours</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <motion.div
                      className="w-12 h-12 rounded-full border-2 border-white/10"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {metrics?.commandsPerHour.slice(-10).map((item, index) => {
                      const maxCount = Math.max(...(metrics?.commandsPerHour.map(c => c.count) || [1]));
                      const percentage = (item.count / maxCount) * 100;
                      const hour = new Date(item.hour).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        hour12: false
                      });

                      return (
                        <motion.div
                          key={item.hour}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="space-y-2"
                        >
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-white/50">{hour}</span>
                            <span className="text-white/70">{item.count} commands</span>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ delay: index * 0.05 + 0.3, duration: 0.8 }}
                              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Category Breakdown */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="glass-card rounded-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white/90 font-display">
                      Category Distribution
                    </h2>
                    <p className="text-xs text-white/40 font-mono">Event breakdown</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <motion.div
                      className="w-12 h-12 rounded-full border-2 border-white/10"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {metrics?.categoryBreakdown.map((item, index) => {
                      const colors = [
                        { bg: "from-blue-500 to-cyan-500", text: "text-blue-400" },
                        { bg: "from-green-500 to-emerald-500", text: "text-green-400" },
                        { bg: "from-amber-500 to-yellow-500", text: "text-amber-400" },
                        { bg: "from-red-500 to-rose-500", text: "text-red-400" },
                        { bg: "from-slate-500 to-zinc-500", text: "text-slate-400" },
                      ];
                      const color = colors[index % colors.length];

                      return (
                        <motion.div
                          key={item.category}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-mono text-white/70">{item.category}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-mono text-white/40">{item.count.toLocaleString()}</span>
                              <span className={cn("text-sm font-bold font-mono", color.text)}>
                                {item.percentage.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${item.percentage}%` }}
                              transition={{ delay: index * 0.1 + 0.3, duration: 0.8 }}
                              className={cn("h-full bg-gradient-to-r rounded-full", color.bg)}
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="glass-card rounded-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white/90 font-display">
                      Recent Activity
                    </h2>
                    <p className="text-xs text-white/40 font-mono">Last 2 hours (10min intervals)</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <motion.div
                      className="w-12 h-12 rounded-full border-2 border-white/10"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                ) : (
                  <div className="flex items-end justify-between gap-1 h-64">
                    {metrics?.recentActivity.slice(-20).map((item, index) => {
                      const maxCount = Math.max(...(metrics?.recentActivity.map(a => a.count) || [1]));
                      const height = (item.count / maxCount) * 100;

                      return (
                        <motion.div
                          key={item.timestamp}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: `${height}%`, opacity: 1 }}
                          transition={{ delay: index * 0.03, duration: 0.5 }}
                          className="flex-1 bg-gradient-to-t from-emerald-500 to-green-500 rounded-t-sm min-h-[4px] relative group"
                          title={`${item.timestamp}: ${item.count} events`}
                        >
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <div className="bg-black/90 text-white text-xs font-mono px-2 py-1 rounded whitespace-nowrap">
                              {item.count}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Top Commands */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="glass-card rounded-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white/90 font-display">
                      Top Commands
                    </h2>
                    <p className="text-xs text-white/40 font-mono">Most frequently used</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <motion.div
                      className="w-12 h-12 rounded-full border-2 border-white/10"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                ) : metrics?.topCommands && metrics.topCommands.length > 0 ? (
                  <div className="space-y-3">
                    {metrics.topCommands.map((item, index) => {
                      const maxCount = metrics.topCommands[0]?.count || 1;
                      const percentage = (item.count / maxCount) * 100;

                      return (
                        <motion.div
                          key={item.command}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all duration-300"
                        >
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center text-amber-400 font-bold font-mono text-sm">
                            #{index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-mono text-white/80 font-medium">{item.command}</span>
                              <span className="text-sm font-mono text-white/40">{item.count}x</span>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ delay: index * 0.05 + 0.3, duration: 0.8 }}
                                className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full"
                              />
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <Terminal className="w-12 h-12 text-white/20 mb-4" />
                    <p className="font-mono text-white/30 text-sm">No command data available</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
