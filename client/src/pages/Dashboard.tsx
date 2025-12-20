import { useState } from "react";
import { useLogs, useCreateLog } from "@/hooks/use-logs";
import { LogCard } from "@/components/LogCard";
import { StatsCard } from "@/components/StatsCard";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Terminal, 
  Search, 
  Filter, 
  Activity, 
  AlertOctagon, 
  CheckCircle2, 
  RefreshCw,
  Plus
} from "lucide-react";
import {
  Dialog,
  DialogContent,
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
  const { data: logs, isLoading, error, refetch } = useLogs();
  const createLog = useCreateLog();
  const { toast } = useToast();
  
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [newLevel, setNewLevel] = useState("info");

  // Stats calculation
  const totalLogs = logs?.length || 0;
  const errorCount = logs?.filter(l => l.level.toLowerCase() === "error").length || 0;
  const warningCount = logs?.filter(l => l.level.toLowerCase() === "warning").length || 0;
  const infoCount = logs?.filter(l => l.level.toLowerCase() === "info").length || 0;

  const filteredLogs = logs?.filter(log => 
    log.message.toLowerCase().includes(search.toLowerCase()) ||
    log.level.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => new Date(b.timestamp || "").getTime() - new Date(a.timestamp || "").getTime());

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
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard 
            title="Total Events" 
            value={totalLogs} 
            icon={Activity} 
            trend="Live monitoring active"
            className="border-primary/20 bg-primary/5"
          />
          <StatsCard 
            title="System Errors" 
            value={errorCount} 
            icon={AlertOctagon} 
            className="border-red-500/20 bg-red-500/5 text-red-500"
          />
          <StatsCard 
            title="Warnings" 
            value={warningCount} 
            icon={AlertOctagon} 
            className="border-yellow-500/20 bg-yellow-500/5 text-yellow-500"
          />
          <StatsCard 
            title="Info Logs" 
            value={infoCount} 
            icon={CheckCircle2} 
            className="border-blue-500/20 bg-blue-500/5 text-blue-500"
          />
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card/30 p-4 rounded-xl border border-border/40 backdrop-blur-sm sticky top-[70px] z-30">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input 
              placeholder="Search logs via regex or keywords..."
              className="w-full bg-background/50 border border-border rounded-lg pl-10 pr-4 py-2 text-sm font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => refetch()}
              className="font-mono text-xs gap-2 border-border/50 hover:border-primary hover:text-primary transition-colors"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
              REFRESH
            </Button>
            
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button 
                  size="sm"
                  className="font-mono text-xs gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  INJECT LOG
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border border-2">
                <DialogHeader>
                  <DialogTitle className="font-mono text-primary flex items-center gap-2">
                    <Terminal className="w-5 h-5" />
                    Inject System Log
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Log Level</Label>
                    <Select value={newLevel} onValueChange={setNewLevel}>
                      <SelectTrigger className="font-mono border-border bg-background/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="info" className="font-mono">INFO</SelectItem>
                        <SelectItem value="warning" className="font-mono text-yellow-500">WARNING</SelectItem>
                        <SelectItem value="error" className="font-mono text-red-500">ERROR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Message Payload</Label>
                    <Input 
                      placeholder="System event description..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="font-mono bg-background/50 border-border"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreateOpen(false)}
                    className="font-mono"
                  >
                    CANCEL
                  </Button>
                  <Button 
                    onClick={handleCreateLog}
                    disabled={createLog.isPending || !newMessage}
                    className="font-mono bg-primary text-primary-foreground"
                  >
                    {createLog.isPending ? "INJECTING..." : "EXECUTE"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Logs Console */}
        <div className="rounded-xl border border-border/50 bg-card/20 backdrop-blur-sm min-h-[500px] flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/20 rounded-t-xl">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
              <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
            </div>
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              /var/log/syslog
            </div>
          </div>

          <div className="p-4 space-y-2 flex-1 relative">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                    <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-primary/20 animate-ping opacity-20" />
                  </div>
                  <p className="text-sm font-mono text-primary animate-pulse">Initializing data stream...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                  <AlertOctagon className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-red-500 font-display">Connection Severed</h3>
                <p className="text-muted-foreground font-mono max-w-sm">
                  Unable to establish link with the main server database. Retrying...
                </p>
                <Button variant="outline" onClick={() => refetch()} className="border-red-500/50 text-red-500 hover:bg-red-500/10">
                  RETRY CONNECTION
                </Button>
              </div>
            ) : filteredLogs?.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-20 opacity-50">
                <Terminal className="w-12 h-12 mb-4 text-muted-foreground" />
                <p className="font-mono text-muted-foreground">No system logs found.</p>
              </div>
            ) : (
              <div className="space-y-2 pb-4">
                {filteredLogs?.map((log, i) => (
                  <LogCard key={log.id} log={log} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
