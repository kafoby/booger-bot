import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { motion } from "framer-motion";
import { useMemo } from "react";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import Config from "@/pages/Config";
import NotFound from "@/pages/not-found";

// Floating particles background component - memoized to prevent re-renders
function FloatingParticles() {
  const particles = useMemo(() => {
    return [...Array(20)].map((_, i) => ({
      id: i,
      width: Math.random() * 300 + 50,
      height: Math.random() * 300 + 50,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      xMove: Math.random() * 100 - 50,
      yMove: Math.random() * 100 - 50,
      duration: Math.random() * 20 + 15,
    }));
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-white/[0.02]"
          style={{
            width: p.width,
            height: p.height,
            left: p.left,
            top: p.top,
          }}
          animate={{
            x: [0, p.xMove, 0],
            y: [0, p.yMove, 0],
            scale: [1, 1.1, 1],
            opacity: [0.02, 0.05, 0.02],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <motion.div
            className="w-20 h-20 rounded-full border-2 border-white/10"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-2 rounded-full bg-gradient-to-br from-white/10 to-transparent"
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="w-3 h-3 rounded-full bg-white/40" />
          </motion.div>
        </div>
        <motion.p
          className="text-sm font-mono text-white/50 tracking-widest uppercase"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Authenticating
        </motion.p>
      </div>
    </div>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated || !user?.hasRequiredRole) {
    return <Redirect to="/login" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/config">
        <ProtectedRoute component={Config} />
      </Route>
      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <FloatingParticles />
          <Router />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
