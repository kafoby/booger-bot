import { LogOut, Shield, Settings } from "lucide-react";
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

export function Header() {
  const { user, logout } = useAuth();
  const { data: botStatus, isLoading: statusLoading } = useBotStatus();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-lg shadow-primary/20 animate-pulse">
            <img src="https://i.postimg.cc/QCKmp9HK/IMG-0772.jpg" alt="Logo" className="w-6 h-6 object-cover rounded" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              CrustyButtNugget<span className="text-primary">.log</span>
            </h1>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  statusLoading
                    ? "bg-gray-500"
                    : botStatus?.isOnline
                    ? "bg-green-500 animate-pulse"
                    : "bg-red-500"
                )}
              />
              {statusLoading
                ? "Checking..."
                : botStatus?.lastSeenText || "Unknown"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase text-muted-foreground font-mono tracking-wider">Uptime</span>
              <span className="text-sm font-mono text-primary">
                {statusLoading ? "..." : botStatus?.uptime || "N/A"}
              </span>
            </div>
            <div className="w-px h-8 bg-border/50" />
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase text-muted-foreground font-mono tracking-wider">Status</span>
              <span className={cn(
                "text-sm font-mono",
                botStatus?.isOnline ? "text-green-500" : "text-red-500"
              )}>
                {statusLoading ? "..." : botStatus?.isOnline ? "Online" : "Offline"}
              </span>
            </div>
          </div>

          {user && (
            <>
              <div className="w-px h-8 bg-border/50 hidden md:block" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                    <Avatar className="h-10 w-10 border-2 border-primary/20">
                      <AvatarImage src={getDiscordAvatarUrl(user)} alt={user.username} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.username}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email || `Discord ID: ${user.discordId}`}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-xs text-muted-foreground cursor-default" disabled>
                    <Shield className="mr-2 h-3 w-3 text-green-500" />
                    <span>Authorized Role</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <Link href="/config">
                    <DropdownMenuItem className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Bot Configuration</span>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-500 cursor-pointer">
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
