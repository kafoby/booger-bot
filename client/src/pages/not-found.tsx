import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Animated background orbs */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(100,100,150,0.1) 0%, transparent 70%)",
          left: "20%",
          top: "30%",
        }}
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 20, 0],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute w-[300px] h-[300px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(80,80,120,0.08) 0%, transparent 70%)",
          right: "20%",
          bottom: "30%",
        }}
        animate={{
          scale: [1, 1.1, 1],
          x: [0, -15, 0],
          y: [0, 15, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10"
      >
        <Card className="w-full max-w-md glass-card border-white/10 rounded-2xl overflow-hidden">
          <CardContent className="pt-8 pb-8 text-center">
            {/* Animated 404 icon */}
            <motion.div
              className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-white/10 to-white/[0.02] border border-white/10 flex items-center justify-center mb-6 relative"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <AlertCircle className="h-10 w-10 text-white/50" />
              {/* Pulse ring */}
              <motion.div
                className="absolute inset-0 rounded-2xl border border-white/20"
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>

            {/* Error text */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <h1 className="text-6xl font-bold text-gradient font-display mb-2">404</h1>
              <h2 className="text-xl font-semibold text-white/70 mb-4">Page Not Found</h2>
              <p className="text-sm text-white/40 font-mono mb-8">
                The page you're looking for doesn't exist or has been moved.
              </p>
            </motion.div>

            {/* Action buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-3 justify-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <Link href="/">
                <Button
                  className="gap-2 bg-white/10 hover:bg-white/15 text-white border border-white/10 hover:border-white/20 rounded-xl
                    shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:shadow-[0_0_30px_rgba(255,255,255,0.08)]
                    transition-all duration-300 w-full sm:w-auto"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => window.history.back()}
                className="gap-2 border-white/10 hover:border-white/20 hover:bg-white/5 text-white/60 hover:text-white/90 rounded-xl w-full sm:w-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                Go Back
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Decorative line */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.6, duration: 1 }}
      />
    </div>
  );
}
