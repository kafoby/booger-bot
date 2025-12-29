import { useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useConfig, useUpdateConfig, useAdmins, useAddAdmin, useRemoveAdmin } from "@/hooks/use-config";
import { useToast } from "@/hooks/use-toast";
import {
  Settings,
  Hash,
  Shield,
  UserPlus,
  Trash2,
  Save,
  Lock,
  Loader2,
  ArrowLeft
} from "lucide-react";
import { Link } from "wouter";

// List of all available commands that can be toggled
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
  const { toast } = useToast();

  const [prefix, setPrefix] = useState<string>(",");
  const [disabledCommands, setDisabledCommands] = useState<string[]>([]);
  const [allowedChannels, setAllowedChannels] = useState<string[]>([]);
  const [newChannelId, setNewChannelId] = useState("");
  const [newAdminId, setNewAdminId] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize local state when data loads
  useState(() => {
    if (data?.config) {
      setPrefix(data.config.prefix);
      setDisabledCommands(data.config.disabledCommands || []);
      setAllowedChannels(data.config.allowedChannels || []);
    }
  });

  // Update local state when data changes
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col font-sans">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col font-sans">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center text-red-500">Failed to load configuration</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 space-y-8">
        {/* Back button and title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Settings className="h-6 w-6 text-primary" />
                Bot Configuration
              </h1>
              <p className="text-sm text-muted-foreground">
                {isAdmin ? "Manage bot settings and permissions" : "View bot settings (read-only)"}
              </p>
            </div>
          </div>
          {!isAdmin && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Read Only
            </Badge>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Prefix Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5 text-primary" />
                Command Prefix
              </CardTitle>
              <CardDescription>
                The character that triggers bot commands
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                  className="w-20 text-center text-lg font-mono"
                  maxLength={3}
                />
                <span className="text-sm text-muted-foreground">
                  Example: {prefix}help, {prefix}cat
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Allowed Channels */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5 text-primary" />
                Allowed Channels
              </CardTitle>
              <CardDescription>
                Channels where the bot responds to commands
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {allowedChannels.length === 0 ? (
                  <span className="text-sm text-muted-foreground">All channels allowed</span>
                ) : (
                  allowedChannels.map((channelId) => (
                    <Badge key={channelId} variant="secondary" className="flex items-center gap-1">
                      #{channelId}
                      {isAdmin && (
                        <button
                          onClick={() => handleRemoveChannel(channelId)}
                          className="ml-1 hover:text-red-500"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  ))
                )}
              </div>
              {isAdmin && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Channel ID"
                    value={newChannelId}
                    onChange={(e) => setNewChannelId(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleAddChannel} size="sm">
                    Add
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Command Toggles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Command Toggles
            </CardTitle>
            <CardDescription>
              Enable or disable individual bot commands
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {AVAILABLE_COMMANDS.map((cmd) => {
                const isDisabled = disabledCommands.includes(cmd.name);
                return (
                  <div
                    key={cmd.name}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex flex-col">
                      <span className="font-mono text-sm font-medium">
                        {prefix}{cmd.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {cmd.description}
                      </span>
                    </div>
                    <Switch
                      checked={!isDisabled}
                      onCheckedChange={() => handleToggleCommand(cmd.name)}
                      disabled={!isAdmin}
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Admin Management (only visible to admins) */}
        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Admin Management
              </CardTitle>
              <CardDescription>
                Manage users who can edit bot configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {adminsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Default Admins (cannot be removed)</Label>
                    <div className="flex flex-wrap gap-2">
                      {adminsData?.defaultAdmins.map((id) => (
                        <Badge key={id} variant="default" className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          {id}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Additional Admins</Label>
                    <div className="flex flex-wrap gap-2">
                      {adminsData?.admins.length === 0 ? (
                        <span className="text-sm text-muted-foreground">No additional admins</span>
                      ) : (
                        adminsData?.admins.map((admin) => (
                          <Badge key={admin.id} variant="secondary" className="flex items-center gap-1">
                            {admin.discordId}
                            <button
                              onClick={() => handleRemoveAdmin(admin.discordId)}
                              className="ml-1 hover:text-red-500"
                              disabled={removeAdmin.isPending}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Discord User ID"
                      value={newAdminId}
                      onChange={(e) => setNewAdminId(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleAddAdmin}
                      size="sm"
                      disabled={addAdmin.isPending}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Admin
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Save Button */}
        {isAdmin && hasChanges && (
          <div className="fixed bottom-6 right-6">
            <Button
              onClick={handleSaveConfig}
              size="lg"
              disabled={updateConfig.isPending}
              className="shadow-lg"
            >
              {updateConfig.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
