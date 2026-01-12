import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useStarboardConfig,
  useSaveStarboardConfig,
  useDeleteStarboardConfig,
} from "@/hooks/use-starboard";
import { useToast } from "@/hooks/use-toast";
import { Star, Trash2, Save, Loader2 } from "lucide-react";

export default function Starboard() {
  const [monitoredChannelId, setMonitoredChannelId] = useState("");
  const [emoji, setEmoji] = useState("⭐");
  const [threshold, setThreshold] = useState(5);
  const [starboardChannelId, setStarboardChannelId] = useState("");

  const { data: config, isLoading } = useStarboardConfig();
  const saveConfig = useSaveStarboardConfig();
  const deleteConfig = useDeleteStarboardConfig();
  const { toast } = useToast();

  // Load existing config when found
  useEffect(() => {
    if (config) {
      setMonitoredChannelId(config.monitoredChannelId);
      setEmoji(config.emoji);
      setThreshold(config.threshold);
      setStarboardChannelId(config.starboardChannelId);
    }
  }, [config]);

  const handleSave = async () => {
    if (!monitoredChannelId || !emoji || !starboardChannelId) {
      toast({
        title: "Validation Error",
        description: "All fields are required",
        variant: "destructive",
      });
      return;
    }

    if (threshold < 1) {
      toast({
        title: "Validation Error",
        description: "Threshold must be at least 1",
        variant: "destructive",
      });
      return;
    }

    try {
      await saveConfig.mutateAsync({
        monitoredChannelId,
        emoji,
        threshold,
        starboardChannelId,
      });
      toast({
        title: "Success",
        description: "Starboard configuration saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save starboard configuration",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this starboard configuration?")) {
      return;
    }

    try {
      await deleteConfig.mutateAsync();
      toast({
        title: "Success",
        description: "Starboard configuration deleted successfully",
      });
      // Reset form
      setMonitoredChannelId("");
      setEmoji("⭐");
      setThreshold(5);
      setStarboardChannelId("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete starboard configuration",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center gap-3">
          <Star className="h-8 w-8 text-yellow-500" />
          <div>
            <h1 className="text-3xl font-bold">Starboard Configuration</h1>
            <p className="text-muted-foreground">
              Automatically post popular messages to a starboard channel
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Starboard Settings</CardTitle>
            <CardDescription>
              Configure which channel to monitor and where to post starred messages
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Monitored Channel ID */}
            <div className="space-y-2">
              <Label htmlFor="monitoredChannelId">Monitored Channel ID *</Label>
              <Input
                id="monitoredChannelId"
                placeholder="123456789012345678"
                value={monitoredChannelId}
                onChange={(e) => setMonitoredChannelId(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-sm text-muted-foreground">
                Channel to watch for reactions (e.g., #general)
              </p>
            </div>

            {/* Emoji */}
            <div className="space-y-2">
              <Label htmlFor="emoji">Reaction Emoji *</Label>
              <Input
                id="emoji"
                placeholder="⭐"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                maxLength={10}
                disabled={isLoading}
              />
              <p className="text-sm text-muted-foreground">
                Emoji that triggers the starboard (e.g., ⭐, 👍, 🔥)
              </p>
            </div>

            {/* Threshold */}
            <div className="space-y-2">
              <Label htmlFor="threshold">Reaction Threshold *</Label>
              <Input
                id="threshold"
                type="number"
                min={1}
                value={threshold}
                onChange={(e) => setThreshold(parseInt(e.target.value) || 1)}
                disabled={isLoading}
              />
              <p className="text-sm text-muted-foreground">
                Number of reactions needed to post to starboard
              </p>
            </div>

            {/* Starboard Channel ID */}
            <div className="space-y-2">
              <Label htmlFor="starboardChannelId">Starboard Channel ID *</Label>
              <Input
                id="starboardChannelId"
                placeholder="123456789012345678"
                value={starboardChannelId}
                onChange={(e) => setStarboardChannelId(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-sm text-muted-foreground">
                Channel where starred messages will be posted (e.g., #starboard)
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
            <p>1. Bot monitors the configured channel for reactions</p>
            <p>2. When a message reaches the threshold, it's posted to the starboard channel</p>
            <p>3. Each message is only posted once (duplicates are prevented)</p>
            <p>4. The starboard embed includes: author, content, jump link, and reaction count</p>
            <p>5. Images from the original message are also displayed</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
