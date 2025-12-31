import { useState } from "react";
import { useLogs, useCreateLog } from "@/hooks/use-logs";
import { LogCard } from "@/components/LogCard";
import { StatsCard } from "@/components/StatsCard";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal,
  Search,
  Filter,
  Activity,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Plus,
  X,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [newLevel, setNewLevel] = useState("info");

  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useLogs(levelFilter, search);
  const createLog = useCreateLog();
  const { toast } = useToast();

  const logs = data?.pages.flatMap((page) => page.logs) || [];
  const stats = data?.pages[0]?.stats;
  const totalLogs = stats?.total || 0;
  const errorCount = stats?.error || 0;
  const warningCount = stats?.warning || 0;
  const infoCount = stats?.info || 0;
  const filteredTotal = data?.pages[0]?.total || 0;

  const handleLevelFilter = (level: string | null) => {
    setLevelFilter(levelFilter === level ? null : level);
  };

  const handleCreateLog = async () => {
    try {
      await createLog.mutateAsync({
        message: newMessage,
        level: newLevel,
      });
      toast({
        title: "Log Injected",
        description: "System log entry created successfully.",
      });
      setIsCreateOpen(false);
      setNewMessage("");
      setNewLevel("info");
    } catch (e) {
      toast({
        title: "Injection Failed",
        description: "Could not create log entry.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans relative">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 space-y-8 relative z-10">
        {/* Stats Grid with staggered animation */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.1 },
            },
          }}
        >
          <StatsCard
            title="Total Events"
            value={totalLogs}
            icon={Activity}
            trend={levelFilter ? "Click to clear filters" : "Live monitoring"}
            onClick={() => setLevelFilter(null)}
            isActive={levelFilter === null}
            index={0}
          />
          <StatsCard
            title="Errors"
            value={errorCount}
            icon={AlertOctagon}
            onClick={() => handleLevelFilter("error")}
            isActive={levelFilter === "error"}
            index={1}
          />
          <StatsCard
            title="Warnings"
            value={warningCount}
            icon={AlertTriangle}
            onClick={() => handleLevelFilter("warning")}
            isActive={levelFilter === "warning"}
            index={2}
          />
          <StatsCard
            title="Info"
            value={infoCount}
            icon={CheckCircle2}
            onClick={() => handleLevelFilter("info")}
            isActive={levelFilter === "info"}
            index={3}
          />
        </motion.div>

        {/* Toolbar with glass effect */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex flex-col md:flex-row gap-4 items-center justify-between glass-card p-4 rounded-2xl sticky top-[70px] z-30"
        >
          <div className="flex flex-col md:flex-row gap-3 w-full md:flex-1">
            {/* Search input with animated focus */}
            <div className="relative w-full md:flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-white/60 transition-colors duration-300" />
              <input
                placeholder="Search logs via regex or keywords..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm font-mono
                  placeholder:text-white/30 text-white/80
                  focus:outline-none focus:border-white/20 focus:bg-white/[0.08] focus:ring-2 focus:ring-white/5
                  transition-all duration-300"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {/* Focus glow effect */}
              <div className="absolute inset-0 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none shadow-[0_0_20px_rgba(255,255,255,0.05)]" />
            </div>

            {/* Active filter badge */}
            <AnimatePresence>
              {levelFilter && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, x: -10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: -10 }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/10 border border-white/15 rounded-xl text-xs font-mono"
                >
                  <Filter className="w-3.5 h-3.5 text-white/60" />
                  <span className="text-white/80 uppercase tracking-wider">
                    {levelFilter}
                  </span>
                  <button
                    onClick={() => setLevelFilter(null)}
                    className="ml-1 text-white/40 hover:text-white/70 transition-colors p-0.5 hover:bg-white/10 rounded"
                    aria-label="Clear filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Refresh button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="font-mono text-xs gap-2 border-white/10 hover:border-white/20 hover:bg-white/5 text-white/60 hover:text-white/90 transition-all duration-300 rounded-xl px-4 py-2.5"
            >
              <RefreshCw
                className={cn("w-3.5 h-3.5", isLoading && "animate-spin")}
              />
              REFRESH
            </Button>

            {/* Create log dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="font-mono text-xs gap-2 bg-white/10 hover:bg-white/15 text-white border border-white/10 hover:border-white/20
                    shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:shadow-[0_0_30px_rgba(255,255,255,0.08)]
                    transition-all duration-300 rounded-xl px-4 py-2.5 group"
                >
                  <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-300" />
                  INJECT LOG
                  <Sparkles className="w-3 h-3 opacity-50" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-900 border-white/10 rounded-2xl max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-display text-xl text-gradient flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                      <Zap className="w-5 h-5 text-white/70" />
                    </div>
                    Inject System Log
                  </DialogTitle>
                  <DialogDescription className="text-white/40 text-sm">
                    Create a new log entry in the system.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-5 py-4">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-widest text-white/40 font-mono">
                      Log Level
                    </Label>
                    <Select value={newLevel} onValueChange={setNewLevel}>
                      <SelectTrigger className="font-mono border-white/10 bg-white/5 rounded-xl focus:ring-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-white/10 rounded-xl">
                        <SelectItem
                          value="info"
                          className="font-mono hover:bg-white/5 rounded-lg"
                        >
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-400" />
                            INFO
                          </span>
                        </SelectItem>
                        <SelectItem
                          value="warning"
                          className="font-mono hover:bg-white/5 rounded-lg"
                        >
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-400" />
                            WARNING
                          </span>
                        </SelectItem>
                        <SelectItem
                          value="error"
                          className="font-mono hover:bg-white/5 rounded-lg"
                        >
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-400" />
                            ERROR
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-widest text-white/40 font-mono">
                      Message Payload
                    </Label>
                    <Input
                      placeholder="System event description..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="font-mono bg-white/5 border-white/10 rounded-xl focus:border-white/20 focus:ring-white/10 placeholder:text-white/30"
                    />
                  </div>
                </div>
                <DialogFooter className="gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                    className="font-mono border-white/10 hover:bg-white/5 text-white/60 rounded-xl"
                  >
                    CANCEL
                  </Button>
                  <Button
                    onClick={handleCreateLog}
                    disabled={createLog.isPending || !newMessage}
                    className="font-mono bg-white/10 hover:bg-white/15 text-white border border-white/10 rounded-xl"
                  >
                    {createLog.isPending ? "INJECTING..." : "EXECUTE"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {/* Logs Console with fancy design */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="rounded-2xl glass-card min-h-[500px] flex flex-col overflow-hidden"
        >
          {/* Console header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-3">
              {/* macOS-style dots */}
              <div className="flex items-center gap-2">
                <motion.div
                  className="w-3 h-3 rounded-full bg-red-500/50 border border-red-500/30"
                  whileHover={{ scale: 1.2 }}
                />
                <motion.div
                  className="w-3 h-3 rounded-full bg-amber-500/50 border border-amber-500/30"
                  whileHover={{ scale: 1.2 }}
                />
                <motion.div
                  className="w-3 h-3 rounded-full bg-emerald-500/50 border border-emerald-500/30"
                  whileHover={{ scale: 1.2 }}
                />
              </div>
              <div className="w-px h-4 bg-white/10 ml-2" />
              <Terminal className="w-4 h-4 text-white/30" />
            </div>
            <div className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em]">
              /var/log/syslog
            </div>
          </div>

          <div className="p-5 space-y-2 flex-1 relative">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                  <div className="relative">
                    <motion.div
                      className="w-16 h-16 rounded-full border-2 border-white/10"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                    <motion.div
                      className="absolute inset-3 rounded-full bg-gradient-to-br from-white/10 to-transparent"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <div className="w-2 h-2 rounded-full bg-white/40" />
                    </motion.div>
                  </div>
                  <motion.p
                    className="text-sm font-mono text-white/40 tracking-widest uppercase"
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    Loading data stream
                  </motion.p>
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-6">
                <motion.div
                  className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <AlertOctagon className="w-10 h-10 text-red-400" />
                </motion.div>
                <div>
                  <h3 className="text-xl font-bold text-gradient font-display mb-2">
                    Connection Severed
                  </h3>
                  <p className="text-white/40 font-mono max-w-sm">
                    Unable to establish link with the main server database.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => refetch()}
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl"
                >
                  RETRY CONNECTION
                </Button>
              </div>
            ) : logs?.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-20">
                <motion.div
                  className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Terminal className="w-8 h-8 text-white/20" />
                </motion.div>
                <p className="font-mono text-white/30">No system logs found.</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 pb-4">
                  {logs?.map((log, i) => (
                    <LogCard key={log.id} log={log} index={i} />
                  ))}
                </div>

                {hasNextPage && (
                  <motion.div
                    className="flex justify-center py-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Button
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      variant="outline"
                      className="font-mono text-xs border-white/10 hover:border-white/20 hover:bg-white/5 rounded-xl px-6"
                    >
                      {isFetchingNextPage ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />
                          LOADING...
                        </>
                      ) : (
                        `LOAD MORE (${logs.length} / ${filteredTotal})`
                      )}
                    </Button>
                  </motion.div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
