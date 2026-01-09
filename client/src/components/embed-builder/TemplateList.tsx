import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Trash2,
  Shield,
  Sparkles,
  Filter,
} from "lucide-react";
import { useDeleteEmbedTemplate } from "@/hooks/use-embed-templates";
import { useToast } from "@/hooks/use-toast";
import type { EmbedTemplate } from "@shared/schema";

interface TemplateListProps {
  templates: EmbedTemplate[];
  selectedTemplate: EmbedTemplate | null;
  onTemplateSelect: (template: EmbedTemplate) => void;
  onNewTemplate: () => void;
}

export default function TemplateList({
  templates,
  selectedTemplate,
  onTemplateSelect,
  onNewTemplate,
}: TemplateListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const deleteTemplate = useDeleteEmbedTemplate();
  const { toast } = useToast();

  const filteredTemplates = templates.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleDelete = async (id: number, isDefault: boolean) => {
    if (isDefault) {
      toast({
        title: "Cannot Delete",
        description: "Default templates cannot be deleted",
        variant: "destructive",
      });
      return;
    }

    try {
      await deleteTemplate.mutateAsync(id);
      toast({
        title: "Template Deleted",
        description: "Template has been removed successfully",
      });
    } catch (err: any) {
      toast({
        title: "Delete Failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-mono uppercase tracking-wider text-white/60">
          Templates
        </h3>
        <Button
          onClick={onNewTemplate}
          size="sm"
          className="gap-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30 border border-white/10 rounded-lg"
        >
          <Plus className="h-4 w-4" />
          New
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 rounded-xl focus:border-purple-500/50 font-mono text-sm"
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="bg-white/5 border-white/10 rounded-xl">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-white/40" />
              <SelectValue placeholder="Filter by category" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="leveling">Leveling</SelectItem>
            <SelectItem value="moderation">Moderation</SelectItem>
            <SelectItem value="utility">Utility</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Template List */}
      <ScrollArea className="h-[calc(100vh-320px)]">
        <div className="space-y-2 pr-4">
          <AnimatePresence mode="popLayout">
            {filteredTemplates.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12"
              >
                <Sparkles className="h-12 w-12 text-white/20 mx-auto mb-3" />
                <p className="text-sm text-white/40 font-mono">No templates found</p>
              </motion.div>
            ) : (
              filteredTemplates.map((template, index) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                >
                  <Card
                    className={`glass-card border rounded-xl p-4 cursor-pointer transition-all duration-300 group ${
                      selectedTemplate?.id === template.id
                        ? "bg-purple-500/10 border-purple-500/50"
                        : "border-white/10 hover:border-white/20 hover:bg-white/5"
                    }`}
                    onClick={() => onTemplateSelect(template)}
                  >
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-white/90 truncate">
                            {template.name}
                          </h4>
                          {template.description && (
                            <p className="text-xs text-white/40 mt-1 line-clamp-2">
                              {template.description}
                            </p>
                          )}
                        </div>
                        {!template.isDefault && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(template.id, template.isDefault || false);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto hover:text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>

                      {/* Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {template.isDefault && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-emerald-500/10 border-emerald-500/30 text-emerald-400 rounded-md px-2 py-0.5"
                          >
                            <Shield className="h-3 w-3 mr-1" />
                            Default
                          </Badge>
                        )}
                        {template.category && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-white/5 border-white/10 text-white/60 rounded-md px-2 py-0.5 capitalize"
                          >
                            {template.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}
