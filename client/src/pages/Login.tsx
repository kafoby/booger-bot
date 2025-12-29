import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, AlertTriangle, Lock, Shield } from "lucide-react";
import { FaDiscord } from "react-icons/fa";

export default function Login() {
  const { isAuthenticated, isLoading, isConfigured, login, logout, user } = useAuth();
  const [, setLocation] = useLocation();

  // Parse URL params for error messages
  const urlParams = new URLSearchParams(window.location.search);
  const errorType = urlParams.get("error");

  // Redirect if already authenticated with required role
  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.hasRequiredRole) {
      setLocation("/");
    }
  }, [isLoading, isAuthenticated, user, setLocation]);

  const getErrorMessage = () => {
    switch (errorType) {
      case "auth_failed":
        return {
          title: "Authentication Failed",
          description: "Discord authentication failed. Please try again.",
        };
      case "no_role":
        return {
          title: "Access Denied",
          description: "You don't have the required Discord role to access this application. Please contact an administrator.",
        };
      default:
        return null;
    }
  };

  const errorMessage = getErrorMessage();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          </div>
          <p className="text-sm font-mono text-primary animate-pulse">Initializing authentication...</p>
        </div>
      </div>
    );
  }

  // Show message if user is authenticated but doesn't have role
  if (isAuthenticated && !user?.hasRequiredRole) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-500/50 bg-red-500/5">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-red-500" />
            </div>
            <CardTitle className="text-red-500 font-display">Access Denied</CardTitle>
            <CardDescription className="text-muted-foreground">
              You're logged in as <span className="text-foreground font-medium">{user?.username}</span>, but you don't have the required Discord role.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive" className="border-red-500/50">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Missing Role</AlertTitle>
              <AlertDescription>
                Contact a server administrator to get access to this dashboard.
              </AlertDescription>
            </Alert>
            <Button
              variant="outline"
              className="w-full"
              onClick={logout}
            >
              Log out and try another account
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 border border-primary/20 overflow-hidden">
            <img src="https://i.postimg.cc/GhG86pj9/dawg.png" alt="dawg" className="w-full h-full object-cover" />
          </div>
          <CardTitle className="text-2xl font-display text-primary">System Access</CardTitle>
          <CardDescription className="text-muted-foreground">
            Authenticate with Discord to access the dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorMessage && (
            <Alert variant="destructive" className="border-red-500/50">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{errorMessage.title}</AlertTitle>
              <AlertDescription>{errorMessage.description}</AlertDescription>
            </Alert>
          )}

          {!isConfigured && (
            <Alert className="border-yellow-500/50 bg-yellow-500/5">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <AlertTitle className="text-yellow-500">Configuration Required</AlertTitle>
              <AlertDescription className="text-muted-foreground">
                Discord OAuth is not configured. Please set up the required environment variables.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Button
              onClick={login}
              disabled={!isConfigured}
              className="w-full gap-2 bg-[#5865F2] hover:bg-[#4752c4] text-white font-medium py-6"
            >
              <FaDiscord className="w-5 h-5" />
              Continue with Discord
            </Button>

            <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
              <Shield className="w-3 h-3" />
              <span>Role-based access required</span>
            </div>
          </div>

          <div className="pt-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground text-center font-mono">
              Access restricted to authorized Discord members only.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
