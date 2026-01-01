import { LogOut, Shield, Settings, ChevronDown, BarChart3, Users, Activity } from "lucide-react";
import { useAuth, getDiscordAvatarUrl } from "@/lib/auth";
import { useBotStatus } from "@/hooks/use-bot-status";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { motion } from "framer-motion";

export function Header() {
  const { user, logout } = useAuth();
  const { data: botStatus, isLoading: statusLoading } = useBotStatus();

  return (
    <header className="sticky top-0 z-40 w-full">
      {/* Glass background with gradient border bottom */}
      <div className="absolute inset-0 glass-strong" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="container mx-auto px-4 h-16 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          {/* Logo with animated glow */}
          <div className="relative group">
            <motion.div
              className="w-11 h-11 rounded-xl bg-gradient-to-br from-white/10 to-white/[0.02] border border-white/10 flex items-center justify-center overflow-hidden relative"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              {/* Subtle inner glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <img
                src="https://i.postimg.cc/QCKmp9HK/IMG-0772.jpg"
                alt="Logo"
                className="w-7 h-7 object-cover rounded relative z-10"
              />
            </motion.div>
            {/* Pulse ring on hover */}
            <div className="absolute inset-0 rounded-xl border border-white/20 opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" />
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight text-gradient">
              CrustyButtNugget<span className="text-white/40">.log</span>
            </h1>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
              <motion.span
                className={cn(
                  "w-2 h-2 rounded-full relative",
                  statusLoading
                    ? "bg-white/30"
                    : botStatus?.isOnline
                    ? "bg-emerald-400"
                    : "bg-red-400"
                )}
                animate={
                  botStatus?.isOnline && !statusLoading
                    ? { scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }
                    : {}
                }
                transition={{ duration: 2, repeat: Infinity }}
              >
                {/* Glow effect for online status */}
                {botStatus?.isOnline && !statusLoading && (
                  <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-30" />
                )}
              </motion.span>
              <span className="text-white/40">
                {statusLoading
                  ? "Checking..."
                  : botStatus?.lastSeenText || "Unknown"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Stats section */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase text-white/30 font-mono tracking-wider">
                Uptime
              </span>
              <span className="text-sm font-mono text-white/70">
                {statusLoading ? "..." : botStatus?.uptime || "N/A"}
              </span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase text-white/30 font-mono tracking-wider">
                Status
              </span>
              <span
                className={cn(
                  "text-sm font-mono font-medium",
                  botStatus?.isOnline ? "text-emerald-400" : "text-red-400"
                )}
              >
                {statusLoading
                  ? "..."
                  : botStatus?.isOnline
                  ? "Online"
                  : "Offline"}
              </span>
            </div>
          </div>

          {user && (
            <>
              <div className="w-px h-8 bg-white/10 hidden md:block" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-auto py-2 px-3 rounded-xl hover:bg-white/5 group flex items-center gap-2"
                  >
                    <Avatar className="h-9 w-9 border border-white/10 group-hover:border-white/20 transition-colors">
                      <AvatarImage
                        src={getDiscordAvatarUrl(user)}
                        alt={user.username}
                      />
                      <AvatarFallback className="bg-white/5 text-white/70 text-sm">
                        {user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="w-4 h-4 text-white/30 group-hover:text-white/50 transition-colors hidden md:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 glass-card border-white/10"
                  align="end"
                  forceMount
                >
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none text-white/90">
                        {user.username}
                      </p>
                      <p className="text-xs leading-none text-white/40">
                        {user.email || `Discord ID: ${user.discordId}`}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    className="text-xs text-white/40 cursor-default focus:bg-transparent"
                    disabled
                  >
                    <Shield className="mr-2 h-3 w-3 text-emerald-400" />
                    <span>Authorized Role</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <Link href="/">
                    <DropdownMenuItem className="cursor-pointer hover:bg-white/5 focus:bg-white/5 text-white/70 hover:text-white/90">
                      <Activity className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/performance">
                    <DropdownMenuItem className="cursor-pointer hover:bg-white/5 focus:bg-white/5 text-white/70 hover:text-white/90">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      <span>Performance Metrics</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/users">
                    <DropdownMenuItem className="cursor-pointer hover:bg-white/5 focus:bg-white/5 text-white/70 hover:text-white/90">
                      <Users className="mr-2 h-4 w-4" />
                      <span>User Activity</span>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <Link href="/config">
                    <DropdownMenuItem className="cursor-pointer hover:bg-white/5 focus:bg-white/5 text-white/70 hover:text-white/90">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Bot Configuration</span>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    onClick={logout}
                    className="text-red-400 cursor-pointer hover:bg-red-500/10 focus:bg-red-500/10 hover:text-red-300"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
