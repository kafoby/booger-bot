import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  useAutoreactConfig,
  useSaveAutoreactConfig,
  useDeleteAutoreactConfig,
} from "@/hooks/use-autoreact";
import { useToast } from "@/hooks/use-toast";
import { Smile, Trash2, Save, Loader2, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AutoReact() {
  const [channelId, setChannelId] = useState("");
  const [type, setType] = useState<"all" | "embed" | "file">("all");
  const [emojis, setEmojis] = useState<string[]>(["😎"]);
  const [newEmoji, setNewEmoji] = useState("");

  const { data: config, isLoading } = useAutoreactConfig();
  const saveConfig = useSaveAutoreactConfig();
  const deleteConfig = useDeleteAutoreactConfig();
  const { toast } = useToast();

  // Load existing config when found
  useEffect(() => {
    if (config) {
      setChannelId(config.channelId);
      setType(config.type);
      setEmojis(config.emojis);
    }
  }, [config]);

  const handleAddEmoji = () => {
    if (!newEmoji.trim()) {
      return;
    }
    if (emojis.includes(newEmoji.trim())) {
      toast({
        title: "Duplicate Emoji",
        description: "This emoji is already in the list",
        variant: "destructive",
      });
      return;
    }
    setEmojis([...emojis, newEmoji.trim()]);
    setNewEmoji("");
  };

  const handleRemoveEmoji = (emoji: string) => {
    setEmojis(emojis.filter((e) => e !== emoji));
  };

  const handleSave = async () => {
    if (!channelId || emojis.length === 0) {
      toast({
        title: "Validation Error",
        description: "Channel ID and at least one emoji are required",
        variant: "destructive",
      });
      return;
    }

    try {
      await saveConfig.mutateAsync({
        channelId,
        type,
        emojis,
      });
      toast({
        title: "Success",
        description: "AutoReact configuration saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save autoreact configuration",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this autoreact configuration?")) {
      return;
    }

    try {
      await deleteConfig.mutateAsync();
      toast({
        title: "Success",
        description: "AutoReact configuration deleted successfully",
      });
      // Reset form
      setChannelId("");
      setType("all");
      setEmojis(["😎"]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete autoreact configuration",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center gap-3">
          <Smile className="h-8 w-8 text-blue-500" />
          <div>
            <h1 className="text-3xl font-bold">AutoReact Configuration</h1>
            <p className="text-muted-foreground">
              Automatically add emoji reactions to messages in specific channels
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>AutoReact Settings</CardTitle>
            <CardDescription>
              Configure which channel to monitor and what emojis to add
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Channel ID */}
            <div className="space-y-2">
              <Label htmlFor="channelId">Channel ID *</Label>
              <Input
                id="channelId"
                placeholder="123456789012345678"
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-sm text-muted-foreground">
                Channel where bot will automatically react to messages
              </p>
            </div>

            {/* Message Type Filter */}
            <div className="space-y-3">
              <Label>React to Message Type *</Label>
              <RadioGroup value={type} onValueChange={(value) => setType(value as typeof type)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="type-all" />
                  <Label htmlFor="type-all" className="font-normal cursor-pointer">
                    All Messages
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="embed" id="type-embed" />
                  <Label htmlFor="type-embed" className="font-normal cursor-pointer">
                    Only Messages with Embeds
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="file" id="type-file" />
                  <Label htmlFor="type-file" className="font-normal cursor-pointer">
                    Only Messages with File Attachments
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Emojis */}
            <div className="space-y-3">
              <Label>Emojis to React With *</Label>

              {/* Current Emojis */}
              <div className="flex flex-wrap gap-2">
                {emojis.map((emoji) => (
                  <Badge key={emoji} variant="secondary" className="text-lg px-3 py-1">
                    {emoji}
                    <button
                      onClick={() => handleRemoveEmoji(emoji)}
                      className="ml-2 text-destructive hover:text-destructive/80"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {emojis.length === 0 && (
                  <p className="text-sm text-muted-foreground">No emojis added yet</p>
                )}
              </div>

              {/* Add Emoji */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add emoji (e.g., 👍, 🔥, 😎)"
                  value={newEmoji}
                  onChange={(e) => setNewEmoji(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddEmoji();
                    }
                  }}
                  className="flex-1"
                />
                <Button onClick={handleAddEmoji} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Add emojis one at a time. They will be added to messages in order.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={isLoading || saveConfig.isPending}
              >
                {saveConfig.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Configuration
                  </>
                )}
              </Button>

              {config && (
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isLoading || deleteConfig.isPending}
                >
                  {deleteConfig.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Configuration
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>1. Bot monitors the configured channel for new messages</p>
            <p>2. Checks if the message matches the selected type filter</p>
            <p>3. Automatically adds all configured emojis as reactions (in order)</p>
            <p>4. Invalid emojis are skipped with a console warning</p>
            <p>5. If bot lacks permissions, it stops trying to add reactions</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
