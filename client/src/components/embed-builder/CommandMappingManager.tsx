import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Save, Link as LinkIcon, Command, Loader2, Plus, Trash2 } from "lucide-react";
import {
  useCommandMappings,
  useCreateCommandMapping,
  useUpdateCommandMapping,
  useDeleteCommandMapping,
} from "@/hooks/use-embed-templates";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import type { EmbedTemplate, CommandTemplateMapping } from "@shared/schema";

interface CommandMappingManagerProps {
  templates: EmbedTemplate[];
}

// Available commands that can be mapped
const AVAILABLE_COMMANDS = [
  { name: "levels.level_up", description: "Level up notification", defaultContext: "notification" },
  { name: "levels.rank", description: "User rank display", defaultContext: "default" },
  { name: "levels.leaderboard", description: "Top users leaderboard", defaultContext: "default" },
];

export default function CommandMappingManager({ templates }: CommandMappingManagerProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: mappings, isLoading } = useCommandMappings();
  const createMapping = useCreateCommandMapping();
  const updateMapping = useUpdateCommandMapping();
  const deleteMapping = useDeleteCommandMapping();

  const [localMappings, setLocalMappings] = useState<
    Record<
      string,
      { id?: number; templateId: number | null; context: string; isNew: boolean }
    >
  >({});

  useEffect(() => {
    if (mappings) {
      const mapped: typeof localMappings = {};
      mappings.forEach((m) => {
        mapped[m.commandName] = {
          id: m.id,
          templateId: m.templateId,
          context: m.context || "default",
          isNew: false,
        };
      });
      // Add unmapped commands
      AVAILABLE_COMMANDS.forEach((cmd) => {
        if (!mapped[cmd.name]) {
          mapped[cmd.name] = {
            templateId: null,
            context: cmd.defaultContext,
            isNew: true,
          };
        }
      });
      setLocalMappings(mapped);
    }
  }, [mappings]);

  const handleSave = async (commandName: string) => {
    const mapping = localMappings[commandName];
    if (!mapping.templateId) {
      toast({
        title: "Validation Error",
        description: "Please select a template",
        variant: "destructive",
      });
      return;
    }

    try {
      if (mapping.isNew) {
        // Create new mapping
        await createMapping.mutateAsync({
          commandName,
          templateId: mapping.templateId,
          context: mapping.context,
          createdBy: user?.discordId || "unknown",
        });
        toast({
          title: "Mapping Created",
          description: `Template assigned to ${commandName}`,
        });
      } else if (mapping.id) {
        // Update existing mapping
        await updateMapping.mutateAsync({
          id: mapping.id,
          mapping: {
            templateId: mapping.templateId,
            context: mapping.context,
          },
        });
        toast({
          title: "Mapping Updated",
          description: `Template updated for ${commandName}`,
        });
      }
    } catch (err: any) {
      toast({
        title: "Save Failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (commandName: string) => {
    const mapping = localMappings[commandName];
    if (!mapping.id) return;

    try {
      await deleteMapping.mutateAsync(mapping.id);
      toast({
        title: "Mapping Deleted",
        description: `Template unassigned from ${commandName}`,
      });
    } catch (err: any) {
      toast({
        title: "Delete Failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const updateLocalMapping = (
    commandName: string,
    key: "templateId" | "context",
    value: any
  ) => {
    setLocalMappings((prev) => ({
      ...prev,
      [commandName]: {
        ...prev[commandName],
        [key]: value,
      },
    }));
  };

  if (isLoading) {
    return (
      <Card className="glass-card border-white/10 rounded-2xl p-12">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
          <span className="text-white/60 font-mono">Loading mappings...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-white/10 rounded-2xl overflow-hidden">
      <div className="border-b border-white/5 p-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <LinkIcon className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white/90">Command Mappings</h2>
            <p className="text-xs text-white/40 font-mono mt-0.5">
              Assign templates to bot commands
            </p>
          </div>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-280px)]">
        <div className="p-6">
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {AVAILABLE_COMMANDS.map((command, index) => {
                const mapping = localMappings[command.name];
                const hasChanges =
                  mapping &&
                  (mapping.isNew ||
                    (mappings?.find((m) => m.commandName === command.name)?.templateId !==
                      mapping.templateId));

                return (
                  <motion.div
                    key={command.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass-card border-white/10 rounded-xl p-5 space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Command className="h-4 w-4 text-purple-400" />
                          <code className="text-sm font-mono text-white/90 bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20">
                            {command.name}
                          </code>
                          {hasChanges && (
                            <Badge
                              variant="outline"
                              className="bg-orange-500/10 border-orange-500/30 text-orange-400"
                            >
                              Unsaved
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-white/50">{command.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!mapping?.isNew && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(command.name)}
                            className="p-2 h-auto hover:text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          onClick={() => handleSave(command.name)}
                          size="sm"
                          disabled={!hasChanges || createMapping.isPending || updateMapping.isPending}
                          className="gap-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-lg"
                        >
                          <Save className="h-4 w-4" />
                          Save
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-white/60">Template</Label>
                        <Select
                          value={mapping?.templateId?.toString() || ""}
                          onValueChange={(value) =>
                            updateLocalMapping(command.name, "templateId", parseInt(value))
                          }
                        >
                          <SelectTrigger className="bg-white/5 border-white/10 rounded-lg">
                            <SelectValue placeholder="Select template" />
                          </SelectTrigger>
                          <SelectContent>
                            {templates.length === 0 ? (
                              <div className="p-3 text-sm text-white/40 text-center">
                                No templates available
                              </div>
                            ) : (
                              templates.map((template) => (
                                <SelectItem key={template.id} value={template.id.toString()}>
                                  <div className="flex items-center gap-2">
                                    {template.name}
                                    {template.isDefault && (
                                      <Badge
                                        variant="outline"
                                        className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 text-xs"
                                      >
                                        Default
                                      </Badge>
                                    )}
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-white/60">Context</Label>
                        <Input
                          value={mapping?.context || ""}
                          onChange={(e) =>
                            updateLocalMapping(command.name, "context", e.target.value)
                          }
                          placeholder="default"
                          className="bg-white/5 border-white/10 rounded-lg font-mono text-sm"
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
            <p className="text-xs text-white/70 leading-relaxed">
              <span className="font-semibold">💡 Tip:</span> Command mappings tell the bot which
              template to use for each command. Create custom templates in the Builder tab, then
              assign them here.
            </p>
          </div>
        </div>
      </ScrollArea>
    </Card>
  );
}
