import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, BookOpen, Braces } from "lucide-react";
import { useEmbedVariables } from "@/hooks/use-embed-templates";
import { useToast } from "@/hooks/use-toast";

export default function VariableReference() {
  const { data: variables, isLoading } = useEmbedVariables();
  const { toast } = useToast();
  const [copiedVariable, setCopiedVariable] = useState<string | null>(null);

  const handleCopy = async (variable: string) => {
    await navigator.clipboard.writeText(`{${variable}}`);
    setCopiedVariable(variable);
    setTimeout(() => setCopiedVariable(null), 2000);
    toast({
      title: "Copied!",
      description: `{${variable}} copied to clipboard`,
    });
  };

  if (isLoading) {
    return null;
  }

  return (
    <Card className="glass-card border-white/10 rounded-2xl overflow-hidden">
      <div className="border-b border-white/5 p-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-blue-400" />
          <h3 className="text-sm font-mono uppercase tracking-wider text-white/60">
            Variable Reference
          </h3>
        </div>
      </div>

      <div className="p-4">
        <Accordion type="multiple" defaultValue={["user", "leveling", "timestamp"]}>
          {variables &&
            Object.entries(variables).map(([category, vars]) => (
              <AccordionItem
                key={category}
                value={category}
                className="border-b border-white/5 last:border-0"
              >
                <AccordionTrigger className="hover:no-underline py-3 px-3 hover:bg-white/5 rounded-lg transition-colors">
                  <div className="flex items-center gap-2">
                    <Braces className="h-4 w-4 text-purple-400" />
                    <span className="capitalize font-semibold text-white/90">
                      {category}
                    </span>
                    <Badge
                      variant="outline"
                      className="ml-2 bg-white/5 border-white/10 text-white/50 text-xs"
                    >
                      {vars.length}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4 px-3">
                  <div className="space-y-2">
                    {vars.map((variable: any) => (
                      <motion.div
                        key={variable.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="group glass-card border-white/10 rounded-lg p-3 hover:bg-white/5 transition-all duration-200"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <code className="text-sm font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                                {`{${variable.name}}`}
                              </code>
                            </div>
                            <p className="text-xs text-white/60">{variable.description}</p>
                            <div className="flex items-center gap-2 text-xs text-white/40 font-mono">
                              <span className="text-white/30">Example:</span>
                              <span className="text-emerald-400">{variable.example}</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(variable.name)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 h-auto hover:bg-white/10"
                          >
                            <AnimatePresence mode="wait">
                              {copiedVariable === variable.name ? (
                                <motion.div
                                  key="check"
                                  initial={{ scale: 0.5, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0.5, opacity: 0 }}
                                >
                                  <Check className="h-4 w-4 text-emerald-400" />
                                </motion.div>
                              ) : (
                                <motion.div
                                  key="copy"
                                  initial={{ scale: 0.5, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0.5, opacity: 0 }}
                                >
                                  <Copy className="h-4 w-4 text-white/60" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
        </Accordion>

        <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20">
          <p className="text-xs text-white/70">
            💡 <span className="font-semibold">Tip:</span> Type{" "}
            <code className="px-1.5 py-0.5 rounded bg-white/10 font-mono">{"{"}</code> in any
            text field to see variable suggestions
          </p>
        </div>
      </div>
    </Card>
  );
}
