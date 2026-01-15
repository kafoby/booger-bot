import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Music, ExternalLink, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface LfmConnection {
  id: number;
  discordUserId: string;
  lastfmUsername: string;
  sessionKey: string;
  scrobblingEnabled: boolean;
  timestamp: string;
}

interface ScrobbleRecord {
  id: number;
  discordUserId: string;
  artist: string;
  track: string;
  album: string | null;
  timestamp: string;
  scrobbledAt: string;
  success: boolean;
  errorMessage: string | null;
}

interface ScrobbleStats {
  total: number;
  failed: number;
}

export default function LastFm() {
  const [connection, setConnection] = useState<LfmConnection | null>(null);
  const [history, setHistory] = useState<ScrobbleRecord[]>([]);
  const [stats, setStats] = useState<ScrobbleStats>({ total: 0, failed: 0 });
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const { toast } = useToast();

  const fetchConnection = async () => {
    try {
      const res = await fetch("/api/auth/user");
      if (!res.ok) return;

      const user = await res.json();

      // Try to get Last.fm connection
      try {
        const lfmRes = await fetch(`/api/lfm/${user.discordId}`, {
          headers: {
            "x-bot-api-key": import.meta.env.VITE_BOT_API_KEY || "",
          },
        });

        if (lfmRes.ok) {
          const data = await lfmRes.json();
          setConnection(data);
        } else {
          setConnection(null);
        }
      } catch (err) {
        setConnection(null);
      }
    } catch (err) {
      console.error("Failed to fetch connection:", err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/auth/user");
      if (!res.ok) return;

      const user = await res.json();

      const historyRes = await fetch(`/api/lfm/scrobbles/${user.discordId}`);
      if (historyRes.ok) {
        const data = await historyRes.json();
        setHistory(data.history || []);
        setStats(data.stats || { total: 0, failed: 0 });
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchConnection(), fetchHistory()]);
      setLoading(false);
    };

    loadData();
  }, []);

  const handleAuth = async () => {
    try {
      const res = await fetch("/api/auth/user");
      if (!res.ok) {
        toast({
          title: "Error",
          description: "Please log in first",
          variant: "destructive",
        });
        return;
      }

      const user = await res.json();

      const authRes = await fetch(`/api/lfm/auth/start?discordUserId=${user.discordId}`);
      if (!authRes.ok) {
        throw new Error("Failed to start authentication");
      }

      const data = await authRes.json();
      window.open(data.authUrl, "_blank");

      toast({
        title: "Authentication Started",
        description: "Please complete the authentication in the new window, then refresh this page.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to start authentication",
        variant: "destructive",
      });
    }
  };

  const handleToggle = async () => {
    if (!connection) return;

    setToggling(true);
    try {
      const res = await fetch(`/api/lfm/${connection.discordUserId}/toggle`, {
        method: "PUT",
        headers: {
          "x-bot-api-key": import.meta.env.VITE_BOT_API_KEY || "",
        },
      });

      if (!res.ok) {
        throw new Error("Failed to toggle scrobbling");
      }

      const data = await res.json();
      setConnection(data);

      toast({
        title: "Success",
        description: `Scrobbling ${data.scrobblingEnabled ? "enabled" : "disabled"}`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to toggle scrobbling",
        variant: "destructive",
      });
    } finally {
      setToggling(false);
    }
  };

  const handleDisconnect = async () => {
    if (!connection) return;

    if (!confirm("Are you sure you want to disconnect your Last.fm account?")) {
      return;
    }

    try {
      const res = await fetch(`/api/lfm/${connection.discordUserId}`, {
        method: "DELETE",
        headers: {
          "x-bot-api-key": import.meta.env.VITE_BOT_API_KEY || "",
        },
      });

      if (!res.ok) {
        throw new Error("Failed to disconnect");
      }

      setConnection(null);
      setHistory([]);
      setStats({ total: 0, failed: 0 });

      toast({
        title: "Disconnected",
        description: "Your Last.fm account has been disconnected",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to disconnect",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Music className="h-8 w-8 text-red-500" />
            Last.fm Integration
          </h1>
          <p className="text-muted-foreground mt-1">
            Auto-scrobble tracks you listen to in voice channels
          </p>
        </div>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
          <CardDescription>
            {connection
              ? `Connected as ${connection.lastfmUsername}`
              : "Not connected to Last.fm"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {connection ? (
            <>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Last.fm Profile</Label>
                  <a
                    href={`https://www.last.fm/user/${connection.lastfmUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-500 hover:underline"
                  >
                    {connection.lastfmUsername}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>

                <Button variant="destructive" onClick={handleDisconnect}>
                  Disconnect
                </Button>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="space-y-1">
                  <Label>Auto-Scrobbling</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically scrobble tracks to your Last.fm profile
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={connection.scrobblingEnabled}
                    onCheckedChange={handleToggle}
                    disabled={toggling}
                  />
                  {toggling && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Connect your Last.fm account to start scrobbling
              </p>
              <Button onClick={handleAuth}>
                <Music className="h-4 w-4 mr-2" />
                Connect Last.fm
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      {connection && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Scrobbles</CardTitle>
              <Music className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Successful</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total - stats.failed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.failed}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Scrobble History */}
      {connection && history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Scrobble History</CardTitle>
            <CardDescription>Recent tracks scrobbled to Last.fm</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Track</TableHead>
                  <TableHead>Artist</TableHead>
                  <TableHead>Album</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.track}</TableCell>
                    <TableCell>{record.artist}</TableCell>
                    <TableCell>{record.album || "-"}</TableCell>
                    <TableCell>
                      {new Date(record.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {record.success ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Success
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Failed
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {connection && history.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Music className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No scrobbles yet. Listen to music in voice channels to start scrobbling!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
