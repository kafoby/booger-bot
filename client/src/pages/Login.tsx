import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Lock, Shield, Sparkles } from "lucide-react";
import { FaDiscord } from "react-icons/fa";
import { motion } from "framer-motion";

// Simplified ambient background - static, not mechanical
function AmbientBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Single subtle gradient accent */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full opacity-40"
        style={{
          background: "radial-gradient(circle, rgba(105,110,160,0.12) 0%, transparent 65%)",
          left: "50%",
          top: "25%",
          transform: "translate(-50%, -50%)",
        }}
      />
    </div>
  );
}

export default function Login() {
  const { isAuthenticated, isLoading, isConfigured, login, logout, user } = useAuth();
  const [, setLocation] = useLocation();

  const urlParams = new URLSearchParams(window.location.search);
  const errorType = urlParams.get("error");

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
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <motion.div
              className="w-16 h-16 rounded-full border-2 border-white/10"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-3 rounded-full bg-gradient-to-br from-white/20 to-transparent"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
          <p className="text-sm text-white/50">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && !user?.hasRequiredRole) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
        <AmbientBackground />
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <Card className="w-full max-w-md glass-card border-red-500/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none" />
            <CardHeader className="text-center relative z-10">
              <motion.div
                className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-500/5 flex items-center justify-center mb-4 border border-red-500/20"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Lock className="w-10 h-10 text-red-400" />
              </motion.div>
              <CardTitle className="text-2xl font-display text-gradient">Access Denied</CardTitle>
              <CardDescription className="text-muted-foreground">
                You're logged in as <span className="text-foreground font-medium">{user?.username}</span>, but you don't have the required Discord role.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <Alert variant="destructive" className="border-red-500/30 bg-red-500/5">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Missing Role</AlertTitle>
                <AlertDescription>
                  Contact a server administrator to get access to this dashboard.
                </AlertDescription>
              </Alert>
              <Button
                variant="outline"
                className="w-full border-white/10 hover:border-white/20 hover:bg-white/5 transition-all duration-300"
                onClick={logout}
              >
                Log out and try another account
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <AmbientBackground />

      {/* Decorative grid lines */}
      <div className="absolute inset-0 opacity-[0.015]">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10"
      >
        <Card className="w-full max-w-md glass-card relative overflow-hidden hover-border">
          <CardHeader className="text-center relative z-10 pb-2">
            <div className="mx-auto w-24 h-24 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/10 overflow-hidden">
              <img
                src="https://i.postimg.cc/GhG86pj9/dawg.png"
                alt="Logo"
                className="w-full h-full object-cover"
              />
            </div>

            <div>
              <CardTitle className="text-3xl font-display text-gradient mb-2">
                System Access
              </CardTitle>
              <CardDescription className="text-muted-foreground text-base">
                Authenticate with Discord to access the dashboard
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 relative z-10 pt-4">
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.3 }}
              >
                <Alert variant="destructive" className="border-red-500/30 bg-red-500/5">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>{errorMessage.title}</AlertTitle>
                  <AlertDescription>{errorMessage.description}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            {!isConfigured && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.3 }}
              >
                <Alert className="border-yellow-500/30 bg-yellow-500/5">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <AlertTitle className="text-yellow-500">Configuration Required</AlertTitle>
                  <AlertDescription className="text-muted-foreground">
                    Discord OAuth is not configured. Please set up the required environment variables.
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}

            <div className="space-y-4">
              <Button
                onClick={login}
                disabled={!isConfigured}
                className="w-full gap-3 py-6 text-base font-semibold relative overflow-hidden group/btn
                  bg-[#5865F2] hover:bg-[#4752c4] text-white border-0
                  shadow-[0_0_30px_rgba(88,101,242,0.3)] hover:shadow-[0_0_40px_rgba(88,101,242,0.4)]
                  transition-all duration-300"
              >
                {/* Button shimmer */}
                <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <FaDiscord className="w-6 h-6 relative z-10" />
                <span className="relative z-10">Continue with Discord</span>
                <Sparkles className="w-4 h-4 relative z-10 opacity-60" />
              </Button>

              <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
                <Shield className="w-3.5 h-3.5 text-white/40" />
                <span>Role-based access required</span>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5">
              <p className="text-xs text-muted-foreground text-center">
                Access restricted to authorized Discord members only.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Bottom decorative element */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.8, duration: 1 }}
      />
    </div>
  );
}
