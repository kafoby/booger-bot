import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  Calendar,
  User,
  Save,
  Bookmark,
  Trash2,
  Sparkles,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useSearchPresets, useCreateSearchPreset, useDeleteSearchPreset } from "@/hooks/use-search-presets";
import type { AdvancedFilters } from "@/hooks/use-logs";
import type { SearchPreset } from "@shared/schema";

interface AdvancedSearchProps {
  filters: AdvancedFilters;
  onFiltersChange: (filters: AdvancedFilters) => void;
  children?: React.ReactNode;
}

export function AdvancedSearch({ filters, onFiltersChange, children }: AdvancedSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<AdvancedFilters>(filters);
  const [presetName, setPresetName] = useState("");
  const [showSavePreset, setShowSavePreset] = useState(false);

  const { data: presets = [] } = useSearchPresets();
  const createPreset = useCreateSearchPreset();
  const deletePreset = useDeleteSearchPreset();
  const { toast } = useToast();

  const handleApply = () => {
    console.log('Applying filters:', localFilters);
    onFiltersChange(localFilters);
    setIsOpen(false);
    toast({
      title: "Filters Applied",
      description: "Advanced search filters have been applied.",
    });
  };

  const handleClear = () => {
    const clearedFilters: AdvancedFilters = {};
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
    toast({
      title: "Filters Cleared",
      description: "All filters have been reset.",
    });
  };

  const handleSavePreset = async () => {
    if (!presetName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for the preset.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createPreset.mutateAsync({
        name: presetName,
        filters: localFilters,
      });
      toast({
        title: "Preset Saved",
        description: `Search preset "${presetName}" has been saved.`,
      });
      setPresetName("");
      setShowSavePreset(false);
    } catch (e) {
      toast({
        title: "Save Failed",
        description: "Could not save search preset.",
        variant: "destructive",
      });
    }
  };

  const handleLoadPreset = (preset: SearchPreset) => {
    const parsedFilters = JSON.parse(preset.filters) as AdvancedFilters;
    setLocalFilters(parsedFilters);
    toast({
      title: "Preset Loaded",
      description: `Loaded "${preset.name}" preset.`,
    });
  };

  const handleDeletePreset = async (id: number, name: string) => {
    try {
      await deletePreset.mutateAsync(id);
      toast({
        title: "Preset Deleted",
        description: `Deleted "${name}" preset.`,
      });
    } catch (e) {
      toast({
        title: "Delete Failed",
        description: "Could not delete preset.",
        variant: "destructive",
      });
    }
  };

  const hasActiveFilters = Object.values(localFilters).some((v) => v !== undefined && v !== null && v !== "");

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button
            variant="outline"
            className="relative group border-purple-500/30 hover:border-purple-500/50 bg-purple-500/5 hover:bg-purple-500/10 text-purple-400 transition-all duration-300"
          >
            <Filter className="w-4 h-4 mr-2" />
            Advanced Search
            {hasActiveFilters && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full shadow-lg shadow-purple-500/50"
              />
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-zinc-900/95 backdrop-blur-xl border-purple-500/20 rounded-2xl max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-gradient flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
              <Sparkles className="w-6 h-6 text-purple-400" />
            </div>
            Advanced Search
          </DialogTitle>
          <DialogDescription className="text-white/60 text-sm">
            Apply advanced filters and save presets for quick searches
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* Date Range */}
          <div className="glass-card p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-blue-400" />
              <h3 className="font-mono text-sm font-bold text-white/90 uppercase tracking-wider">Date Range</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-xs text-white/60 font-mono uppercase">From</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={localFilters.startDate || ""}
                  onChange={(e) => setLocalFilters({ ...localFilters, startDate: e.target.value })}
                  className="bg-black/20 border-white/10 focus:border-blue-500/50 text-white/90 font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-xs text-white/60 font-mono uppercase">To</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={localFilters.endDate || ""}
                  onChange={(e) => setLocalFilters({ ...localFilters, endDate: e.target.value })}
                  className="bg-black/20 border-white/10 focus:border-blue-500/50 text-white/90 font-mono text-sm"
                />
              </div>
            </div>
          </div>

          {/* User Filter */}
          <div className="glass-card p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-purple-400" />
              <h3 className="font-mono text-sm font-bold text-white/90 uppercase tracking-wider">User Filter</h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="userId" className="text-xs text-white/60 font-mono uppercase">User ID or Name</Label>
              <Input
                id="userId"
                type="text"
                placeholder="Enter Discord ID or username..."
                value={localFilters.userId || ""}
                onChange={(e) => setLocalFilters({ ...localFilters, userId: e.target.value })}
                className="bg-black/20 border-white/10 focus:border-purple-500/50 text-white/90 font-mono text-sm"
              />
            </div>
          </div>

          {/* Saved Presets */}
          {presets.length > 0 && (
            <div className="glass-card p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Bookmark className="w-4 h-4 text-amber-400" />
                <h3 className="font-mono text-sm font-bold text-white/90 uppercase tracking-wider">Saved Presets</h3>
              </div>
              <div className="space-y-2">
                {presets.map((preset) => (
                  <motion.div
                    key={preset.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/5 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all duration-200 group"
                  >
                    <button
                      onClick={() => handleLoadPreset(preset)}
                      className="flex-1 text-left flex items-center gap-2"
                    >
                      <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                      <span className="font-mono text-sm text-white/80 group-hover:text-white/90">{preset.name}</span>
                    </button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeletePreset(preset.id, preset.name)}
                      className="h-8 w-8 p-0 hover:bg-red-500/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all duration-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Save Current Filters */}
          {hasActiveFilters && (
            <AnimatePresence>
              {showSavePreset ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="glass-card p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 space-y-3"
                >
                  <Label htmlFor="presetName" className="text-xs text-white/80 font-mono uppercase">Preset Name</Label>
                  <div className="flex gap-2">
                    <Input
                      id="presetName"
                      type="text"
                      placeholder="My search preset..."
                      value={presetName}
                      onChange={(e) => setPresetName(e.target.value)}
                      className="bg-black/20 border-white/10 focus:border-green-500/50 text-white/90 font-mono text-sm"
                      onKeyDown={(e) => e.key === "Enter" && handleSavePreset()}
                    />
                    <Button
                      onClick={handleSavePreset}
                      disabled={createPreset.isPending}
                      className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30"
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => setShowSavePreset(false)}
                      variant="ghost"
                      className="hover:bg-red-500/20 hover:text-red-400"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Button
                    onClick={() => setShowSavePreset(true)}
                    variant="outline"
                    className="w-full border-green-500/30 hover:border-green-500/50 bg-green-500/5 hover:bg-green-500/10 text-green-400"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save as Preset
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 pt-4 border-t border-white/10">
          <Button
            onClick={handleClear}
            variant="outline"
            className="flex-1 border-white/10 hover:bg-white/5 text-white/60 font-mono"
          >
            <X className="w-4 h-4 mr-2" />
            CLEAR
          </Button>
          <Button
            onClick={handleApply}
            className="flex-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-400 border border-purple-500/30 font-mono"
          >
            <Search className="w-4 h-4 mr-2" />
            APPLY
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
