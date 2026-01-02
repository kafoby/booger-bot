import { useState } from "react";
import { useLogs, useCreateLog, useBulkDeleteLogs, type AdvancedFilters } from "@/hooks/use-logs";
import { LogCard } from "@/components/LogCard";
import { Header } from "@/components/Header";
import { AdvancedSearch } from "@/components/AdvancedSearch";
import { ActiveFilters } from "@/components/ActiveFilters";
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
  RefreshCw,
  Plus,
  X,
  Sparkles,
  Zap,
  MessageSquare,
  Code2,
  Megaphone,
  ShieldAlert,
  Settings,
  Trash2,
  CheckSquare,
  Square,
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
import { useConfig } from "@/hooks/use-config";

type CategoryType = "all" | "message" | "command" | "output" | "moderation" | "system";

interface CategoryConfig {
  id: CategoryType;
  label: string;
  icon: any;
  color: string;
  gradient: string;
  description: string;
}

const categories: CategoryConfig[] = [
  {
    id: "all",
    label: "All Activity",
    icon: Activity,
    color: "text-purple-400",
    gradient: "from-purple-500/20 to-pink-500/20",
    description: "All system events"
  },
  {
    id: "message",
    label: "Messages",
    icon: MessageSquare,
    color: "text-blue-400",
    gradient: "from-blue-500/20 to-cyan-500/20",
    description: "Chat messages"
  },
  {
    id: "command",
    label: "Commands",
    icon: Code2,
    color: "text-green-400",
    gradient: "from-green-500/20 to-emerald-500/20",
    description: "Bot commands"
  },
  {
    id: "output",
    label: "Outputs",
    icon: Megaphone,
    color: "text-amber-400",
    gradient: "from-amber-500/20 to-yellow-500/20",
    description: "Bot responses"
  },
  {
    id: "moderation",
    label: "Moderation",
    icon: ShieldAlert,
    color: "text-red-400",
    gradient: "from-red-500/20 to-rose-500/20",
    description: "Warns & timeouts"
  },
  {
    id: "system",
    label: "System",
    icon: Settings,
    color: "text-slate-400",
    gradient: "from-slate-500/20 to-zinc-500/20",
    description: "System events"
  },
];

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryType>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [newLevel, setNewLevel] = useState("info");
  const [newCategory, setNewCategory] = useState("system");
  const [selectedLogs, setSelectedLogs] = useState<Set<number>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({});

  // Combine all filters
  const filters: AdvancedFilters = {
    level: null,
    search,
    category: activeCategory === "all" ? null : activeCategory,
    ...advancedFilters,
  };

  console.log('Dashboard filters:', filters);
  console.log('Advanced filters state:', advancedFilters);

  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useLogs(filters);
  const createLog = useCreateLog();
  const bulkDeleteLogs = useBulkDeleteLogs();
  const { data: configData } = useConfig();
  const { toast } = useToast();

  const isAdmin = configData?.isAdmin || false;

  const logs = data?.pages.flatMap((page) => page.logs) || [];
  const categoryStats = data?.pages[0]?.categoryStats;
  const filteredTotal = data?.pages[0]?.total || 0;

  const handleCreateLog = async () => {
    try {
      await createLog.mutateAsync({
        message: newMessage,
        level: newLevel,
        category: newCategory,
      });
      toast({
        title: "Log Injected",
        description: "System log entry created successfully.",
      });
      setIsCreateOpen(false);
      setNewMessage("");
      setNewLevel("info");
      setNewCategory("system");
    } catch (e) {
      toast({
        title: "Injection Failed",
        description: "Could not create log entry.",
        variant: "destructive",
      });
    }
  };

  const toggleLogSelection = (id: number) => {
    setSelectedLogs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedLogs.size === logs.length) {
      setSelectedLogs(new Set());
    } else {
      setSelectedLogs(new Set(logs.map((log) => log.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLogs.size === 0) return;

    try {
      await bulkDeleteLogs.mutateAsync(Array.from(selectedLogs));
      toast({
        title: "Logs Deleted",
        description: `Successfully deleted ${selectedLogs.size} log${selectedLogs.size !== 1 ? 's' : ''}.`,
      });
      setSelectedLogs(new Set());
      setIsSelectionMode(false);
    } catch (e) {
      toast({
        title: "Deletion Failed",
        description: "Could not delete selected logs.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveFilter = (key: keyof AdvancedFilters) => {
    setAdvancedFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  };

  const handleClearAllFilters = () => {
    setAdvancedFilters({});
    toast({
      title: "Filters Cleared",
      description: "All advanced filters have been removed.",
    });
  };

  const hasAdvancedFilters = Object.values(advancedFilters).some((v) => v !== undefined && v !== null && v !== "");
  const activeConfig = categories.find((c) => c.id === activeCategory) || categories[0];

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
        {/* Category Navigation */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass-card rounded-2xl p-2"
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {categories.map((category, index) => {
              const Icon = category.icon;
              const isActive = activeCategory === category.id;
              const count = category.id === "all"
                ? categoryStats?.total || 0
                : categoryStats?.[category.id as keyof typeof categoryStats] || 0;

              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={cn(
                    "relative flex flex-col items-center gap-3 p-4 rounded-xl transition-all duration-200",
                    "border hover-border",
                    isActive
                      ? `border-white/20 bg-gradient-to-br ${category.gradient} shadow-lg shadow-white/5`
                      : "border-white/8 bg-white/[0.02] hover:bg-white/[0.04]"
                  )}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeCategory"
                      className="absolute inset-0 rounded-xl bg-white/5 border-2 border-white/20"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}

                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300",
                        isActive ? "bg-white/10 shadow-lg" : "bg-white/5"
                      )}
                    >
                      <Icon className={cn("w-5 h-5", isActive ? category.color : "text-white/40")} />
                    </div>
                    <div className="text-center">
                      <div
                        className={cn(
                          "text-xs font-medium transition-colors duration-200",
                          isActive ? "text-white" : "text-white/60"
                        )}
                      >
                        {category.label}
                      </div>
                      <div
                        className={cn(
                          "text-[11px] transition-colors duration-200",
                          isActive ? category.color : "text-white/40"
                        )}
                      >
                        {count.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Active Category Info Banner */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "glass-card rounded-2xl p-6 bg-gradient-to-br",
              activeConfig.gradient
            )}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center">
                <activeConfig.icon className={cn("w-7 h-7", activeConfig.color)} />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gradient font-display">
                  {activeConfig.label}
                </h2>
                <p className="text-sm text-white/50 font-mono mt-1">
                  {activeConfig.description}
                </p>
              </div>
              <div className="text-right">
                <div className={cn("text-3xl font-bold font-mono", activeConfig.color)}>
                  {filteredTotal.toLocaleString()}
                </div>
                <div className="text-xs text-white/40 uppercase tracking-wider font-mono">
                  Total Logs
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Toolbar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex flex-col md:flex-row gap-4 items-center justify-between glass-card p-4 rounded-2xl sticky top-[70px] z-30"
        >
          <div className="flex flex-col md:flex-row gap-3 w-full md:flex-1">
            {/* Search input */}
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
              <div className="absolute inset-0 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none shadow-[0_0_20px_rgba(255,255,255,0.05)]" />
            </div>

            {/* Search indicator */}
            <AnimatePresence>
              {search && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, x: -10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: -10 }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/10 border border-white/15 rounded-xl text-xs font-mono"
                >
                  <Filter className="w-3.5 h-3.5 text-white/60" />
                  <span className="text-white/80">
                    Searching: {search}
                  </span>
                  <button
                    onClick={() => setSearch("")}
                    className="ml-1 text-white/40 hover:text-white/70 transition-colors p-0.5 hover:bg-white/10 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Live indicator */}
            <motion.div
              className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl"
              animate={{ opacity: [1, 0.6, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.div
                className="w-2 h-2 rounded-full bg-emerald-400"
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                LIVE
              </span>
            </motion.div>

            {/* Advanced Search */}
            <AdvancedSearch
              filters={advancedFilters}
              onFiltersChange={setAdvancedFilters}
            />

            {/* Selection mode toggle - admin only */}
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsSelectionMode(!isSelectionMode);
                  if (isSelectionMode) {
                    setSelectedLogs(new Set());
                  }
                }}
                className={cn(
                  "font-mono text-xs gap-2 transition-all duration-300 rounded-xl px-4 py-2.5",
                  isSelectionMode
                    ? "bg-purple-500/20 border-purple-500/30 text-purple-400 hover:bg-purple-500/25"
                    : "border-white/10 hover:border-white/20 hover:bg-white/5 text-white/60 hover:text-white/90"
                )}
              >
                {isSelectionMode ? (
                  <CheckSquare className="w-3.5 h-3.5" />
                ) : (
                  <Square className="w-3.5 h-3.5" />
                )}
                {isSelectionMode ? "EXIT SELECT" : "SELECT"}
              </Button>
            )}

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
                      Category
                    </Label>
                    <Select value={newCategory} onValueChange={setNewCategory}>
                      <SelectTrigger className="font-mono border-white/10 bg-white/5 rounded-xl focus:ring-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-white/10 rounded-xl">
                        <SelectItem value="message" className="font-mono hover:bg-white/5 rounded-lg">MESSAGE</SelectItem>
                        <SelectItem value="command" className="font-mono hover:bg-white/5 rounded-lg">COMMAND</SelectItem>
                        <SelectItem value="output" className="font-mono hover:bg-white/5 rounded-lg">OUTPUT</SelectItem>
                        <SelectItem value="moderation" className="font-mono hover:bg-white/5 rounded-lg">MODERATION</SelectItem>
                        <SelectItem value="system" className="font-mono hover:bg-white/5 rounded-lg">SYSTEM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-widest text-white/40 font-mono">
                      Log Level
                    </Label>
                    <Select value={newLevel} onValueChange={setNewLevel}>
                      <SelectTrigger className="font-mono border-white/10 bg-white/5 rounded-xl focus:ring-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-white/10 rounded-xl">
                        <SelectItem value="info" className="font-mono hover:bg-white/5 rounded-lg">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-400" />
                            INFO
                          </span>
                        </SelectItem>
                        <SelectItem value="warning" className="font-mono hover:bg-white/5 rounded-lg">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-400" />
                            WARNING
                          </span>
                        </SelectItem>
                        <SelectItem value="error" className="font-mono hover:bg-white/5 rounded-lg">
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

        {/* Active Filters Display */}
        <AnimatePresence>
          {hasAdvancedFilters && (
            <ActiveFilters
              filters={advancedFilters}
              onRemoveFilter={handleRemoveFilter}
              onClearAll={handleClearAllFilters}
            />
          )}
        </AnimatePresence>

        {/* Logs Console */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, scale: 0.98, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -20 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="rounded-2xl glass-card min-h-[500px] flex flex-col overflow-hidden"
          >
            {/* Console header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-3">
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
              <div className="text-xs font-mono text-white/40">
                /var/log/{activeCategory}
              </div>
            </div>

            <div className="flex-1 relative">
              {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex items-center gap-3 font-mono text-sm text-white/50">
                    <div className="flex gap-1">
                      <motion.div
                        className="w-1.5 h-1.5 rounded-full bg-white/40"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
                      />
                      <motion.div
                        className="w-1.5 h-1.5 rounded-full bg-white/40"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
                      />
                      <motion.div
                        className="w-1.5 h-1.5 rounded-full bg-white/40"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
                      />
                    </div>
                    <span>Loading logs</span>
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
                    Retry Connection
                  </Button>
                </div>
              ) : logs?.length === 0 ? (
                <div className="flex items-center justify-center h-full py-20">
                  <div className="flex items-center gap-3 font-mono text-sm text-white/40">
                    <Terminal className="w-4 h-4" />
                    <span>No logs found in this category</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="pb-4">
                    <AnimatePresence mode="popLayout">
                      {logs?.map((log, i) => (
                        <LogCard
                          key={log.id}
                          log={log}
                          index={i}
                          isSelected={selectedLogs.has(log.id)}
                          isSelectionMode={isSelectionMode}
                          onToggleSelection={toggleLogSelection}
                        />
                      ))}
                    </AnimatePresence>
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
        </AnimatePresence>

        {/* Floating Action Bar - appears when logs are selected */}
        <AnimatePresence>
          {isSelectionMode && selectedLogs.size > 0 && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
            >
              <div className="glass-card rounded-2xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/20 via-transparent to-pink-500/20 p-4 shadow-2xl shadow-purple-500/20">
                <div className="flex items-center gap-6">
                  {/* Selection count */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                      <CheckSquare className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-white font-mono">
                        {selectedLogs.size} Selected
                      </div>
                      <div className="text-xs text-white/40 font-mono">
                        {logs.length} total logs
                      </div>
                    </div>
                  </div>

                  <div className="w-px h-12 bg-white/10" />

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    {/* Select All */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleSelectAll}
                      className="font-mono text-xs gap-2 border-white/10 hover:border-purple-500/30 hover:bg-purple-500/10 text-white/60 hover:text-purple-400 transition-all duration-300 rounded-xl px-4 py-2.5"
                    >
                      {selectedLogs.size === logs.length ? (
                        <>
                          <X className="w-3.5 h-3.5" />
                          DESELECT ALL
                        </>
                      ) : (
                        <>
                          <CheckSquare className="w-3.5 h-3.5" />
                          SELECT ALL
                        </>
                      )}
                    </Button>

                    {/* Bulk Delete */}
                    <Button
                      onClick={handleBulkDelete}
                      disabled={bulkDeleteLogs.isPending}
                      className="font-mono text-xs gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 hover:border-red-500/40 shadow-lg shadow-red-500/20 hover:shadow-red-500/30 transition-all duration-300 rounded-xl px-5 py-2.5 group"
                    >
                      <Trash2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200" />
                      {bulkDeleteLogs.isPending
                        ? `DELETING ${selectedLogs.size}...`
                        : `DELETE ${selectedLogs.size}`}
                    </Button>

                    {/* Cancel */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedLogs(new Set());
                        setIsSelectionMode(false);
                      }}
                      className="font-mono text-xs gap-2 border-white/10 hover:border-white/20 hover:bg-white/5 text-white/60 hover:text-white/90 transition-all duration-300 rounded-xl px-4 py-2.5"
                    >
                      <X className="w-3.5 h-3.5" />
                      CANCEL
                    </Button>
                  </div>
                </div>

                {/* Pulse animation around the bar */}
                <motion.div
                  className="absolute inset-0 rounded-2xl border-2 border-purple-500/20 -z-10"
                  animate={{
                    scale: [1, 1.02, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
