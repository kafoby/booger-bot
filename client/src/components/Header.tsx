import { Terminal, Cpu, Activity, ShieldCheck } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-lg shadow-primary/20 animate-pulse">
            <Terminal className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              NEXUS<span className="text-primary">.LOG</span>
            </h1>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              System Online
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase text-muted-foreground font-mono tracking-wider">Uptime</span>
            <span className="text-sm font-mono text-primary">99.98%</span>
          </div>
          <div className="w-px h-8 bg-border/50" />
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase text-muted-foreground font-mono tracking-wider">Memory</span>
            <span className="text-sm font-mono text-primary">45%</span>
          </div>
        </div>
      </div>
    </header>
  );
}
