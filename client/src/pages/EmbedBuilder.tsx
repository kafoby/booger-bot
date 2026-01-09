import { useState, useCallback } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Sparkles, Code2, Eye } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useEmbedTemplates } from "@/hooks/use-embed-templates";
import TemplateList from "@/components/embed-builder/TemplateList";
import EmbedEditor from "@/components/embed-builder/EmbedEditor";
import EmbedPreview from "@/components/embed-builder/EmbedPreview";
import VariableReference from "@/components/embed-builder/VariableReference";
import CommandMappingManager from "@/components/embed-builder/CommandMappingManager";
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

export default function EmbedBuilder() {
  const { toast } = useToast();
  const { data: templates, isLoading } = useEmbedTemplates();

  const [selectedTemplate, setSelectedTemplate] = useState<EmbedTemplate | null>(null);
  const [embedData, setEmbedData] = useState<EmbedData>({
    title: "",
    description: "",
    color: 10181046, // Default purple
    fields: [],
  });
  const [templateMetadata, setTemplateMetadata] = useState({
    name: "",
    description: "",
    category: "utility" as string,
  });
  const [showRawView, setShowRawView] = useState(false);

  const handleTemplateSelect = useCallback((template: EmbedTemplate) => {
    setSelectedTemplate(template);
    try {
      const parsedData = typeof template.templateData === "string"
        ? JSON.parse(template.templateData)
        : template.templateData;
      setEmbedData(parsedData);
      setTemplateMetadata({
        name: template.name,
        description: template.description || "",
        category: template.category || "utility",
      });
    } catch (err) {
      toast({
        title: "Parse Error",
        description: "Failed to parse template data",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleNewTemplate = useCallback(() => {
    setSelectedTemplate(null);
    setEmbedData({
      title: "",
      description: "",
      color: 10181046,
      fields: [],
    });
    setTemplateMetadata({
      name: "New Template",
      description: "",
      category: "utility",
    });
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col font-sans">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-6">
            <motion.div
              className="w-16 h-16 rounded-full border-2 border-white/10"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            <p className="text-sm font-mono text-white/40 tracking-widest uppercase">
              Loading Templates
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/config">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-white/60 hover:text-white/90 hover:bg-white/5 rounded-xl"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3 bg-gradient-to-br from-white via-white to-white/60 bg-clip-text text-transparent">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10 backdrop-blur-sm">
                  <Code2 className="h-6 w-6 text-purple-400" />
                </div>
                Embed Builder
              </h1>
              <p className="text-sm text-white/40 mt-1 font-mono">
                Design & customize Discord embed templates
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowRawView(!showRawView)}
            className="gap-2 text-white/60 hover:text-white/90 hover:bg-white/5 rounded-xl"
          >
            {showRawView ? <Code2 className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showRawView ? "Code" : "Preview"}
          </Button>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="builder" className="w-full">
          <TabsList className="glass-card border-white/10 rounded-xl p-1 inline-flex">
            <TabsTrigger value="builder" className="rounded-lg data-[state=active]:bg-white/10">
              <Sparkles className="h-4 w-4 mr-2" />
              Template Builder
            </TabsTrigger>
            <TabsTrigger value="mappings" className="rounded-lg data-[state=active]:bg-white/10">
              <Code2 className="h-4 w-4 mr-2" />
              Command Mappings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="builder" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_380px] gap-6">
              {/* Left: Template List */}
              <TemplateList
                templates={templates || []}
                selectedTemplate={selectedTemplate}
                onTemplateSelect={handleTemplateSelect}
                onNewTemplate={handleNewTemplate}
              />

              {/* Center: Editor */}
              <div className="space-y-6">
                <EmbedEditor
                  embedData={embedData}
                  setEmbedData={setEmbedData}
                  templateMetadata={templateMetadata}
                  setTemplateMetadata={setTemplateMetadata}
                  selectedTemplate={selectedTemplate}
                />
                <VariableReference />
              </div>

              {/* Right: Preview */}
              <EmbedPreview
                embedData={embedData}
                showRawView={showRawView}
              />
            </div>
          </TabsContent>

          <TabsContent value="mappings" className="mt-6">
            <CommandMappingManager templates={templates || []} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
