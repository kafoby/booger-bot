import { useState, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Palette,
  Image,
  Type,
  Link as LinkIcon,
  User,
  MessageSquare,
} from "lucide-react";
import { useCreateEmbedTemplate, useUpdateEmbedTemplate } from "@/hooks/use-embed-templates";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import type { EmbedTemplate } from "@shared/schema";

interface EmbedData {
  title?: string;
  description?: string;
  color: number;
  url?: string;
  footer?: { text?: string; icon_url?: string };
  thumbnail?: { url?: string };
  image?: { url?: string };
  author?: { name?: string; icon_url?: string; url?: string };
  fields: Array<{ name: string; value: string; inline: boolean }>;
}

interface TemplateMetadata {
  name: string;
  description: string;
  category: string;
}

interface EmbedEditorProps {
  embedData: EmbedData;
  setEmbedData: (data: EmbedData) => void;
  templateMetadata: TemplateMetadata;
  setTemplateMetadata: (metadata: TemplateMetadata) => void;
  selectedTemplate: EmbedTemplate | null;
}

export default function EmbedEditor({
  embedData,
  setEmbedData,
  templateMetadata,
  setTemplateMetadata,
  selectedTemplate,
}: EmbedEditorProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const createTemplate = useCreateEmbedTemplate();
  const updateTemplate = useUpdateEmbedTemplate();
  const [colorHex, setColorHex] = useState("#9b59b6");

  useEffect(() => {
    // Convert decimal color to hex
    const hex = "#" + embedData.color.toString(16).padStart(6, "0");
    setColorHex(hex);
  }, [embedData.color]);

  const handleColorChange = (hex: string) => {
    setColorHex(hex);
    const decimal = parseInt(hex.replace("#", ""), 16);
    setEmbedData({ ...embedData, color: decimal });
  };

  const addField = () => {
    setEmbedData({
      ...embedData,
      fields: [...embedData.fields, { name: "", value: "", inline: false }],
    });
  };

  const removeField = (index: number) => {
    setEmbedData({
      ...embedData,
      fields: embedData.fields.filter((_, i) => i !== index),
    });
  };

  const updateField = (index: number, key: string, value: any) => {
    const newFields = [...embedData.fields];
    newFields[index] = { ...newFields[index], [key]: value };
    setEmbedData({ ...embedData, fields: newFields });
  };

  const handleSave = async () => {
    if (!templateMetadata.name) {
      toast({
        title: "Validation Error",
        description: "Template name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const templateData = {
        name: templateMetadata.name,
        description: templateMetadata.description,
        category: templateMetadata.category,
        templateData: JSON.stringify(embedData),
        isDefault: false,
        createdBy: user?.discordId || "unknown",
      };

      if (selectedTemplate) {
        await updateTemplate.mutateAsync({
          id: selectedTemplate.id,
          template: templateData,
        });
        toast({
          title: "Template Updated",
          description: "Your changes have been saved",
        });
      } else {
        await createTemplate.mutateAsync(templateData);
        toast({
          title: "Template Created",
          description: "New template has been saved",
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

  const handleReset = () => {
    setEmbedData({
      title: "",
      description: "",
      color: 10181046,
      fields: [],
    });
    setTemplateMetadata({
      name: "",
      description: "",
      category: "utility",
    });
  };

  return (
    <Card className="glass-card border-white/10 rounded-2xl overflow-hidden">
      <div className="border-b border-white/5 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <Type className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white/90">Template Editor</h2>
              <p className="text-xs text-white/40 font-mono mt-0.5">
                Configure your embed template
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="gap-2 hover:bg-white/5 rounded-lg"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button
              onClick={handleSave}
              size="sm"
              disabled={createTemplate.isPending || updateTemplate.isPending}
              className="gap-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-lg"
            >
              <Save className="h-4 w-4" />
              {selectedTemplate ? "Update" : "Save"}
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-280px)]">
        <div className="p-6 space-y-6">
          {/* Template Metadata */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-white/50">
              <MessageSquare className="h-4 w-4" />
              Template Info
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-white/60">Template Name *</Label>
                <Input
                  value={templateMetadata.name}
                  onChange={(e) =>
                    setTemplateMetadata({ ...templateMetadata, name: e.target.value })
                  }
                  placeholder="My Custom Template"
                  className="bg-white/5 border-white/10 rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-white/60">Category</Label>
                <Select
                  value={templateMetadata.category}
                  onValueChange={(value) =>
                    setTemplateMetadata({ ...templateMetadata, category: value })
                  }
                >
                  <SelectTrigger className="bg-white/5 border-white/10 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="leveling">Leveling</SelectItem>
                    <SelectItem value="moderation">Moderation</SelectItem>
                    <SelectItem value="utility">Utility</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-white/60">Description</Label>
              <Input
                value={templateMetadata.description}
                onChange={(e) =>
                  setTemplateMetadata({ ...templateMetadata, description: e.target.value })
                }
                placeholder="Optional description"
                className="bg-white/5 border-white/10 rounded-lg"
              />
            </div>
          </div>

          <Separator className="bg-white/5" />

          {/* Basic Fields */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-white/50">
              <Type className="h-4 w-4" />
              Content
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-white/60">Title</Label>
              <Input
                value={embedData.title || ""}
                onChange={(e) => setEmbedData({ ...embedData, title: e.target.value })}
                placeholder="Use {variables} for dynamic content"
                className="bg-white/5 border-white/10 rounded-lg font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-white/60">Description</Label>
              <Textarea
                value={embedData.description || ""}
                onChange={(e) =>
                  setEmbedData({ ...embedData, description: e.target.value })
                }
                placeholder="Supports {variables} and **markdown**"
                className="bg-white/5 border-white/10 rounded-lg font-mono text-sm min-h-[100px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-white/60 flex items-center gap-2">
                  <Palette className="h-3.5 w-3.5" />
                  Color
                </Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={colorHex}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="w-12 h-10 rounded-lg border border-white/10 cursor-pointer bg-white/5"
                  />
                  <Input
                    value={colorHex}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="bg-white/5 border-white/10 rounded-lg font-mono text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-white/60 flex items-center gap-2">
                  <LinkIcon className="h-3.5 w-3.5" />
                  URL
                </Label>
                <Input
                  value={embedData.url || ""}
                  onChange={(e) => setEmbedData({ ...embedData, url: e.target.value })}
                  placeholder="https://..."
                  className="bg-white/5 border-white/10 rounded-lg font-mono text-sm"
                />
              </div>
            </div>
          </div>

          <Separator className="bg-white/5" />

          {/* Author */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-white/50">
              <User className="h-4 w-4" />
              Author
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-white/60">Name</Label>
                <Input
                  value={embedData.author?.name || ""}
                  onChange={(e) =>
                    setEmbedData({
                      ...embedData,
                      author: { ...embedData.author, name: e.target.value },
                    })
                  }
                  placeholder="{user.name}"
                  className="bg-white/5 border-white/10 rounded-lg font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-white/60">Icon URL</Label>
                <Input
                  value={embedData.author?.icon_url || ""}
                  onChange={(e) =>
                    setEmbedData({
                      ...embedData,
                      author: { ...embedData.author, icon_url: e.target.value },
                    })
                  }
                  placeholder="{user.display_avatar.url}"
                  className="bg-white/5 border-white/10 rounded-lg font-mono text-sm"
                />
              </div>
            </div>
          </div>

          <Separator className="bg-white/5" />

          {/* Images */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-white/50">
              <Image className="h-4 w-4" />
              Images
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-white/60">Thumbnail URL</Label>
                <Input
                  value={embedData.thumbnail?.url || ""}
                  onChange={(e) =>
                    setEmbedData({
                      ...embedData,
                      thumbnail: { url: e.target.value },
                    })
                  }
                  placeholder="{user.display_avatar.url}"
                  className="bg-white/5 border-white/10 rounded-lg font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-white/60">Image URL</Label>
                <Input
                  value={embedData.image?.url || ""}
                  onChange={(e) =>
                    setEmbedData({
                      ...embedData,
                      image: { url: e.target.value },
                    })
                  }
                  placeholder="https://..."
                  className="bg-white/5 border-white/10 rounded-lg font-mono text-sm"
                />
              </div>
            </div>
          </div>

          <Separator className="bg-white/5" />

          {/* Footer */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-white/50">
              <MessageSquare className="h-4 w-4" />
              Footer
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-white/60">Text</Label>
                <Input
                  value={embedData.footer?.text || ""}
                  onChange={(e) =>
                    setEmbedData({
                      ...embedData,
                      footer: { ...embedData.footer, text: e.target.value },
                    })
                  }
                  placeholder="Footer text"
                  className="bg-white/5 border-white/10 rounded-lg font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-white/60">Icon URL</Label>
                <Input
                  value={embedData.footer?.icon_url || ""}
                  onChange={(e) =>
                    setEmbedData({
                      ...embedData,
                      footer: { ...embedData.footer, icon_url: e.target.value },
                    })
                  }
                  placeholder="https://..."
                  className="bg-white/5 border-white/10 rounded-lg font-mono text-sm"
                />
              </div>
            </div>
          </div>

          <Separator className="bg-white/5" />

          {/* Fields */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-white/50">
                <MessageSquare className="h-4 w-4" />
                Fields ({embedData.fields.length}/25)
              </div>
              <Button
                onClick={addField}
                size="sm"
                variant="outline"
                className="gap-2 border-white/10 hover:bg-white/5 rounded-lg"
              >
                <Plus className="h-4 w-4" />
                Add Field
              </Button>
            </div>
            <AnimatePresence mode="popLayout">
              {embedData.fields.map((field, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="glass-card border-white/10 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-white/40">
                      Field {index + 1}
                    </span>
                    <Button
                      onClick={() => removeField(index)}
                      variant="ghost"
                      size="sm"
                      className="p-1 h-auto hover:text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Input
                      value={field.name}
                      onChange={(e) => updateField(index, "name", e.target.value)}
                      placeholder="Field name"
                      className="bg-white/5 border-white/10 rounded-lg font-mono text-sm"
                    />
                    <Textarea
                      value={field.value}
                      onChange={(e) => updateField(index, "value", e.target.value)}
                      placeholder="Field value"
                      className="bg-white/5 border-white/10 rounded-lg font-mono text-sm min-h-[60px]"
                    />
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`inline-${index}`}
                        checked={field.inline}
                        onCheckedChange={(checked) =>
                          updateField(index, "inline", checked)
                        }
                      />
                      <Label
                        htmlFor={`inline-${index}`}
                        className="text-xs text-white/60 cursor-pointer"
                      >
                        Display inline
                      </Label>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </ScrollArea>
    </Card>
  );
}
