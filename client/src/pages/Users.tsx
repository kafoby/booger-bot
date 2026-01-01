import { Header } from "@/components/Header";
import { useUserActivity } from "@/hooks/use-user-activity";
import { motion } from "framer-motion";
import {
  Users as UsersIcon,
  TrendingUp,
  MessageSquare,
  Terminal,
  Crown,
  User,
  Calendar,
  BarChart2,
  AlertOctagon,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function Users() {
  const { data: activity, isLoading, error, refetch } = useUserActivity();

  // Get top 3 users for podium
  const topThree = activity?.topUsers.slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="fixed inset-0 z-0 opacity-30">
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10"
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
              User Activity
            </h1>
            <p className="text-white/40 font-mono text-sm">
              Track user engagement and interaction patterns
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
                Unable to load user activity data. Please try again.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Top Users Podium */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="glass-card rounded-2xl p-8 overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5" />

              <div className="relative z-10 mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    <Crown className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white/90 font-display">
                      Top Contributors
                    </h2>
                    <p className="text-sm text-white/40 font-mono">Most active community members</p>
                  </div>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center h-48">
                    <motion.div
                      className="w-16 h-16 rounded-full border-2 border-white/10"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                ) : topThree.length > 0 ? (
                  <div className="flex items-end justify-center gap-6 pt-8">
                    {/* 2nd Place */}
                    {topThree[1] && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="flex flex-col items-center"
                      >
                        <div className="relative mb-4">
                          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-400/20 to-slate-600/20 border-2 border-slate-400/30 flex items-center justify-center">
                            <User className="w-10 h-10 text-slate-400" />
                          </div>
                          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-slate-400 flex items-center justify-center font-bold text-sm text-black">
                            2
                          </div>
                        </div>
                        <div className="bg-gradient-to-t from-slate-500/20 to-slate-400/10 rounded-t-2xl px-6 py-8 min-w-[140px] border-2 border-b-0 border-slate-400/20">
                          <div className="text-center">
                            <div className="text-sm font-mono font-bold text-white/80 mb-2 truncate">
                              {topThree[1].username}
                            </div>
                            <div className="text-2xl font-bold text-slate-400 font-mono mb-1">
                              {topThree[1].count}
                            </div>
                            <div className="text-xs text-white/40 font-mono">
                              {topThree[1].percentage.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* 1st Place */}
                    {topThree[0] && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col items-center"
                      >
                        <div className="relative mb-4">
                          <motion.div
                            className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-400/20 to-yellow-600/20 border-2 border-amber-400/50 flex items-center justify-center"
                            animate={{
                              boxShadow: [
                                "0 0 20px rgba(251, 191, 36, 0.3)",
                                "0 0 40px rgba(251, 191, 36, 0.5)",
                                "0 0 20px rgba(251, 191, 36, 0.3)",
                              ],
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <Crown className="w-12 h-12 text-amber-400" />
                          </motion.div>
                          <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center font-bold text-black shadow-lg">
                            1
                          </div>
                        </div>
                        <div className="bg-gradient-to-t from-amber-500/20 to-amber-400/10 rounded-t-2xl px-8 py-10 min-w-[160px] border-2 border-b-0 border-amber-400/30">
                          <div className="text-center">
                            <div className="text-base font-mono font-bold text-white/90 mb-3 truncate">
                              {topThree[0].username}
                            </div>
                            <div className="text-3xl font-bold text-amber-400 font-mono mb-1">
                              {topThree[0].count}
                            </div>
                            <div className="text-xs text-white/40 font-mono">
                              {topThree[0].percentage.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* 3rd Place */}
                    {topThree[2] && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex flex-col items-center"
                      >
                        <div className="relative mb-4">
                          <div className="w-18 h-18 rounded-2xl bg-gradient-to-br from-orange-700/20 to-orange-900/20 border-2 border-orange-700/30 flex items-center justify-center">
                            <User className="w-9 h-9 text-orange-700" />
                          </div>
                          <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-orange-700 flex items-center justify-center font-bold text-xs text-black">
                            3
                          </div>
                        </div>
                        <div className="bg-gradient-to-t from-orange-700/20 to-orange-600/10 rounded-t-2xl px-5 py-6 min-w-[120px] border-2 border-b-0 border-orange-700/20">
                          <div className="text-center">
                            <div className="text-xs font-mono font-bold text-white/70 mb-2 truncate">
                              {topThree[2].username}
                            </div>
                            <div className="text-xl font-bold text-orange-700 font-mono mb-1">
                              {topThree[2].count}
                            </div>
                            <div className="text-[10px] text-white/40 font-mono">
                              {topThree[2].percentage.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-white/40 font-mono">
                    No user data available
                  </div>
                )}
              </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Activity Timeline */}
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="glass-card rounded-2xl overflow-hidden"
              >
                <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white/90 font-display">
                        Activity Timeline
                      </h2>
                      <p className="text-xs text-white/40 font-mono">Last 7 days</p>
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
                      {activity?.userTimeline.map((item, index) => {
                        const maxCount = Math.max(...(activity?.userTimeline.map(t => t.count) || [1]));
                        const percentage = (item.count / maxCount) * 100;
                        const date = new Date(item.date);
                        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                        return (
                          <motion.div
                            key={item.date}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="space-y-2"
                          >
                            <div className="flex items-center justify-between text-xs font-mono">
                              <div className="flex items-center gap-2">
                                <span className="text-white/70 font-bold w-10">{dayName}</span>
                                <span className="text-white/40">{dateStr}</span>
                              </div>
                              <span className="text-white/70">{item.count} events</span>
                            </div>
                            <div className="h-3 bg-white/5 rounded-full overflow-hidden">
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

              {/* User Rankings */}
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="glass-card rounded-2xl overflow-hidden"
              >
                <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white/90 font-display">
                        User Rankings
                      </h2>
                      <p className="text-xs text-white/40 font-mono">Top 10 active users</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 max-h-[400px] overflow-y-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                      <motion.div
                        className="w-12 h-12 rounded-full border-2 border-white/10"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activity?.topUsers.map((user, index) => {
                        const colors = [
                          "from-amber-500 to-yellow-500",
                          "from-slate-400 to-slate-600",
                          "from-orange-700 to-orange-900",
                          "from-purple-500 to-pink-500",
                          "from-blue-500 to-cyan-500",
                        ];
                        const color = index < 3 ? colors[index] : colors[index % colors.length];

                        return (
                          <motion.div
                            key={user.username}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all duration-300"
                          >
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold font-mono bg-gradient-to-br",
                              color
                            )}>
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-mono text-white/80 truncate">
                                {user.username}
                              </div>
                              <div className="text-xs text-white/40 font-mono">
                                {user.percentage.toFixed(1)}% of activity
                              </div>
                            </div>
                            <div className="text-lg font-bold font-mono text-white/70">
                              {user.count}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Commands vs Messages */}
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="glass-card rounded-2xl overflow-hidden lg:col-span-2"
              >
                <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                      <BarChart2 className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white/90 font-display">
                        Commands vs Messages
                      </h2>
                      <p className="text-xs text-white/40 font-mono">User activity breakdown</p>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {activity?.commandsByUser.map((user, index) => {
                        const total = user.commands + user.messages;
                        const commandPercentage = total > 0 ? (user.commands / total) * 100 : 0;
                        const messagePercentage = total > 0 ? (user.messages / total) * 100 : 0;

                        return (
                          <motion.div
                            key={user.username}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3"
                          >
                            <div className="flex items-center gap-2">
                              <UsersIcon className="w-4 h-4 text-white/40" />
                              <div className="text-sm font-mono text-white/80 truncate">
                                {user.username}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs font-mono">
                                <div className="flex items-center gap-2">
                                  <Terminal className="w-3 h-3 text-green-400" />
                                  <span className="text-white/60">Commands</span>
                                </div>
                                <span className="text-green-400 font-bold">{user.commands}</span>
                              </div>
                              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                                  style={{ width: `${commandPercentage}%` }}
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs font-mono">
                                <div className="flex items-center gap-2">
                                  <MessageSquare className="w-3 h-3 text-blue-400" />
                                  <span className="text-white/60">Messages</span>
                                </div>
                                <span className="text-blue-400 font-bold">{user.messages}</span>
                              </div>
                              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                                  style={{ width: `${messagePercentage}%` }}
                                />
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
