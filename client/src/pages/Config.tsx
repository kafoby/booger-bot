import { useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useConfig, useUpdateConfig, useAdmins, useAddAdmin, useRemoveAdmin, useAuthBypass, useAddAuthBypass, useRemoveAuthBypass } from "@/hooks/use-config";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  Hash,
  Shield,
  UserPlus,
  Trash2,
  Save,
  Lock,
  Loader2,
  ArrowLeft,
  Sparkles,
  Command,
} from "lucide-react";
import { Link } from "wouter";

const AVAILABLE_COMMANDS = [
  { name: "rapeon", description: "Enable rape mode" },
  { name: "rapeoff", description: "Disable rape mode" },
  { name: "rape", description: "Rape command" },
  { name: "warn", description: "Warn a user" },
  { name: "warns", description: "View warnings" },
  { name: "say", description: "Bot says message" },
  { name: "say2", description: "Bot DMs user" },
  { name: "cat", description: "Random cat GIF" },
  { name: "dog", description: "Random dog GIF" },
  { name: "seal", description: "Random seal image" },
  { name: "crocodile", description: "Random crocodile image" },
  { name: "gay", description: "Gay meter" },
  { name: "kiss", description: "Kiss a user" },
  { name: "slap", description: "Slap a user" },
  { name: "pet", description: "Pet a user" },
  { name: "diddle", description: "Diddle command" },
  { name: "timeout", description: "Timeout a user" },
  { name: "fmset", description: "Set Last.fm username" },
  { name: "fm", description: "Show now playing" },
];

export default function Config() {
  const { data, isLoading, error } = useConfig();
  const updateConfig = useUpdateConfig();
  const { data: adminsData, isLoading: adminsLoading } = useAdmins();
  const addAdmin = useAddAdmin();
  const removeAdmin = useRemoveAdmin();
  const { data: bypassData, isLoading: bypassLoading } = useAuthBypass();
  const addAuthBypass = useAddAuthBypass();
  const removeAuthBypass = useRemoveAuthBypass();
  const { toast } = useToast();

  const [prefix, setPrefix] = useState<string>(",");
  const [disabledCommands, setDisabledCommands] = useState<string[]>([]);
  const [allowedChannels, setAllowedChannels] = useState<string[]>([]);
  const [newChannelId, setNewChannelId] = useState("");
  const [newAdminId, setNewAdminId] = useState("");
  const [newBypassId, setNewBypassId] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  useState(() => {
    if (data?.config) {
      setPrefix(data.config.prefix);
      setDisabledCommands(data.config.disabledCommands || []);
      setAllowedChannels(data.config.allowedChannels || []);
    }
  });

  if (data?.config && !hasChanges) {
    if (prefix !== data.config.prefix) setPrefix(data.config.prefix);
    if (JSON.stringify(disabledCommands) !== JSON.stringify(data.config.disabledCommands || [])) {
      setDisabledCommands(data.config.disabledCommands || []);
    }
    if (JSON.stringify(allowedChannels) !== JSON.stringify(data.config.allowedChannels || [])) {
      setAllowedChannels(data.config.allowedChannels || []);
    }
  }

  const isAdmin = data?.isAdmin ?? false;

  const handleToggleCommand = (commandName: string) => {
    if (!isAdmin) return;
    setHasChanges(true);
    if (disabledCommands.includes(commandName)) {
      setDisabledCommands(disabledCommands.filter(c => c !== commandName));
    } else {
      setDisabledCommands([...disabledCommands, commandName]);
    }
  };

  const handleAddChannel = () => {
    if (!isAdmin || !newChannelId.trim()) return;
    if (!/^\d+$/.test(newChannelId.trim())) {
      toast({ title: "Invalid Channel ID", description: "Channel ID must be a number", variant: "destructive" });
      return;
    }
    setHasChanges(true);
    setAllowedChannels([...allowedChannels, newChannelId.trim()]);
    setNewChannelId("");
  };

  const handleRemoveChannel = (channelId: string) => {
    if (!isAdmin) return;
    setHasChanges(true);
    setAllowedChannels(allowedChannels.filter(c => c !== channelId));
  };

  const handleSaveConfig = async () => {
    try {
      await updateConfig.mutateAsync({
        prefix,
        disabledCommands,
        allowedChannels,
      });
      setHasChanges(false);
      toast({ title: "Configuration Saved", description: "Bot configuration has been updated successfully." });
    } catch (e) {
      toast({ title: "Save Failed", description: "Could not update configuration.", variant: "destructive" });
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminId.trim()) return;
    if (!/^\d+$/.test(newAdminId.trim())) {
      toast({ title: "Invalid Discord ID", description: "Discord ID must be a number", variant: "destructive" });
      return;
    }
    try {
      await addAdmin.mutateAsync(newAdminId.trim());
      setNewAdminId("");
      toast({ title: "Admin Added", description: "New admin has been added successfully." });
    } catch (e) {
      toast({ title: "Add Failed", description: "Could not add admin.", variant: "destructive" });
    }
  };

  const handleRemoveAdmin = async (discordId: string) => {
    try {
      await removeAdmin.mutateAsync(discordId);
      toast({ title: "Admin Removed", description: "Admin has been removed successfully." });
    } catch (e) {
      toast({ title: "Remove Failed", description: "Could not remove admin. Default admins cannot be removed.", variant: "destructive" });
    }
  };

  const handleAddBypass = async () => {
    if (!newBypassId.trim()) return;
    if (!/^\d+$/.test(newBypassId.trim())) {
      toast({ title: "Invalid Discord ID", description: "Discord ID must be a number", variant: "destructive" });
      return;
    }
    try {
      await addAuthBypass.mutateAsync(newBypassId.trim());
      setNewBypassId("");
      toast({ title: "Auth Bypass Added", description: "User has been added to auth bypass list successfully." });
    } catch (e) {
      toast({ title: "Add Failed", description: "Could not add auth bypass user.", variant: "destructive" });
    }
  };

  const handleRemoveBypass = async (discordId: string) => {
    try {
      await removeAuthBypass.mutateAsync(discordId);
      toast({ title: "Auth Bypass Removed", description: "User has been removed from auth bypass list successfully." });
    } catch (e) {
      toast({ title: "Remove Failed", description: "Could not remove auth bypass user. Default bypass users cannot be removed.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col font-sans">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <motion.div
                className="w-16 h-16 rounded-full border-2 border-white/10"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="absolute inset-3 rounded-full bg-gradient-to-br from-white/10 to-transparent"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </div>
            <motion.p
              className="text-sm font-mono text-white/40 tracking-widest uppercase"
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Loading configuration
            </motion.p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col font-sans">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center text-red-400 font-mono">Failed to load configuration</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 space-y-8">
        {/* Back button and title */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-white/60 hover:text-white/90 hover:bg-white/5 rounded-xl"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3 text-gradient font-display">
                <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                  <Settings className="h-6 w-6 text-white/70" />
                </div>
                Bot Configuration
              </h1>
              <p className="text-sm text-white/40 mt-1">
                {isAdmin ? "Manage bot settings and permissions" : "View bot settings (read-only)"}
              </p>
            </div>
          </div>
          {!isAdmin && (
            <Badge className="flex items-center gap-1.5 bg-white/5 border-white/10 text-white/60 rounded-lg px-3 py-1.5">
              <Lock className="h-3 w-3" />
              Read Only
            </Badge>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Prefix Configuration */}
          <div>
            <Card className="glass-card border-white/10 rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-white/5">
                <CardTitle className="flex items-center gap-3 text-gradient">
                  <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                    <Hash className="h-5 w-5 text-white/70" />
                  </div>
                  Command Prefix
                </CardTitle>
                <CardDescription className="text-white/40">
                  The character that triggers bot commands
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Input
                    value={prefix}
                    onChange={(e) => {
                      if (isAdmin) {
                        setPrefix(e.target.value);
                        setHasChanges(true);
                      }
                    }}
                    disabled={!isAdmin}
                    className="w-20 text-center text-lg font-mono bg-white/5 border-white/10 rounded-xl disabled:opacity-50"
                    maxLength={3}
                  />
                  <span className="text-sm text-white/40 font-mono">
                    Example: <span className="text-white/60">{prefix}help</span>, <span className="text-white/60">{prefix}cat</span>
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Allowed Channels */}
          <div>
            <Card className="glass-card border-white/10 rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-white/5">
                <CardTitle className="flex items-center gap-3 text-gradient">
                  <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                    <Hash className="h-5 w-5 text-white/70" />
                  </div>
                  Allowed Channels
                </CardTitle>
                <CardDescription className="text-white/40">
                  Channels where the bot responds to commands
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {allowedChannels.length === 0 ? (
                    <span className="text-sm text-white/40 font-mono">All channels allowed</span>
                  ) : (
                    allowedChannels.map((channelId) => (
                      <motion.div
                        key={channelId}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                      >
                        <Badge className="flex items-center gap-1.5 bg-white/5 border-white/10 text-white/70 rounded-lg px-3 py-1.5 font-mono">
                          #{channelId}
                          {isAdmin && (
                            <button
                              onClick={() => handleRemoveChannel(channelId)}
                              className="ml-1 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </Badge>
                      </motion.div>
                    ))
                  )}
                </div>
                {isAdmin && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Channel ID"
                      value={newChannelId}
                      onChange={(e) => setNewChannelId(e.target.value)}
                      className="flex-1 bg-white/5 border-white/10 rounded-xl font-mono"
                    />
                    <Button
                      onClick={handleAddChannel}
                      size="sm"
                      className="bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl"
                    >
                      Add
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Command Toggles */}
        <div>
          <Card className="glass-card border-white/10 rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-white/5">
              <CardTitle className="flex items-center gap-3 text-gradient">
                <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                  <Command className="h-5 w-5 text-white/70" />
                </div>
                Command Toggles
              </CardTitle>
              <CardDescription className="text-white/40">
                Enable or disable individual bot commands
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {AVAILABLE_COMMANDS.map((cmd) => {
                  const isDisabled = disabledCommands.includes(cmd.name);
                  return (
                    <div
                      key={cmd.name}
                      className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 group"
                    >
                      <div className="flex flex-col">
                        <span className="font-mono text-sm font-medium text-white/80 group-hover:text-white/90 transition-colors">
                          {prefix}{cmd.name}
                        </span>
                        <span className="text-xs text-white/30">
                          {cmd.description}
                        </span>
                      </div>
                      <Switch
                        checked={!isDisabled}
                        onCheckedChange={() => handleToggleCommand(cmd.name)}
                        disabled={!isAdmin}
                        className="data-[state=checked]:bg-emerald-500/50"
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Management */}
        {isAdmin && (
          <div>
            <Card className="glass-card border-white/10 rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-white/5">
                <CardTitle className="flex items-center gap-3 text-gradient">
                  <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                    <Shield className="h-5 w-5 text-white/70" />
                  </div>
                  Admin Management
                </CardTitle>
                <CardDescription className="text-white/40">
                  Manage users who can edit bot configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {adminsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-white/40" />
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-white/40 uppercase tracking-wider">
                        Default Admins (cannot be removed)
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {adminsData?.defaultAdmins.map((id) => (
                          <Badge key={id} className="flex items-center gap-1.5 bg-emerald-500/10 border-emerald-500/20 text-emerald-400 rounded-lg px-3 py-1.5 font-mono">
                            <Shield className="h-3 w-3" />
                            {id}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Separator className="bg-white/5" />

                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-white/40 uppercase tracking-wider">
                        Additional Admins
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {adminsData?.admins.length === 0 ? (
                          <span className="text-sm text-white/30 font-mono">No additional admins</span>
                        ) : (
                          adminsData?.admins.map((admin) => (
                            <Badge key={admin.id} className="flex items-center gap-1.5 bg-white/5 border-white/10 text-white/70 rounded-lg px-3 py-1.5 font-mono">
                              {admin.discordId}
                              <button
                                onClick={() => handleRemoveAdmin(admin.discordId)}
                                className="ml-1 hover:text-red-400 transition-colors"
                                disabled={removeAdmin.isPending}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Input
                        placeholder="Discord User ID"
                        value={newAdminId}
                        onChange={(e) => setNewAdminId(e.target.value)}
                        className="flex-1 bg-white/5 border-white/10 rounded-xl font-mono"
                      />
                      <Button
                        onClick={handleAddAdmin}
                        size="sm"
                        disabled={addAdmin.isPending}
                        className="bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl gap-2"
                      >
                        <UserPlus className="h-4 w-4" />
                        Add Admin
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Auth Bypass Management */}
        {isAdmin && (
          <div>
            <Card className="glass-card border-white/10 rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-white/5">
                <CardTitle className="flex items-center gap-3 text-gradient">
                  <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                    <Lock className="h-5 w-5 text-white/70" />
                  </div>
                  Authentication Bypass
                </CardTitle>
                <CardDescription className="text-white/40">
                  Manage users who can bypass role requirements
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {bypassLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-white/40" />
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-white/40 uppercase tracking-wider">
                        Default Bypass Users (cannot be removed)
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {bypassData?.defaultBypass.map((id) => (
                          <Badge key={id} className="flex items-center gap-1.5 bg-amber-500/10 border-amber-500/20 text-amber-400 rounded-lg px-3 py-1.5 font-mono">
                            <Lock className="h-3 w-3" />
                            {id}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Separator className="bg-white/5" />

                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-white/40 uppercase tracking-wider">
                        Additional Bypass Users
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {bypassData?.bypassUsers.length === 0 ? (
                          <span className="text-sm text-white/30 font-mono">No additional bypass users</span>
                        ) : (
                          bypassData?.bypassUsers.map((user) => (
                            <Badge key={user.id} className="flex items-center gap-1.5 bg-white/5 border-white/10 text-white/70 rounded-lg px-3 py-1.5 font-mono">
                              {user.discordId}
                              <button
                                onClick={() => handleRemoveBypass(user.discordId)}
                                className="ml-1 hover:text-red-400 transition-colors"
                                disabled={removeAuthBypass.isPending}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Input
                        placeholder="Discord User ID"
                        value={newBypassId}
                        onChange={(e) => setNewBypassId(e.target.value)}
                        className="flex-1 bg-white/5 border-white/10 rounded-xl font-mono"
                      />
                      <Button
                        onClick={handleAddBypass}
                        size="sm"
                        disabled={addAuthBypass.isPending}
                        className="bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl gap-2"
                      >
                        <UserPlus className="h-4 w-4" />
                        Add Bypass
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Floating Save Button */}
        <AnimatePresence>
          {isAdmin && hasChanges && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="fixed bottom-8 right-8"
            >
              <Button
                onClick={handleSaveConfig}
                size="lg"
                disabled={updateConfig.isPending}
                className="gap-2 bg-white/10 hover:bg-white/15 text-white border border-white/20 rounded-xl
                  shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.15)]
                  transition-all duration-300 font-mono group"
              >
                {updateConfig.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 group-hover:scale-110 transition-transform" />
                )}
                Save Changes
                <Sparkles className="h-4 w-4 opacity-50" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
