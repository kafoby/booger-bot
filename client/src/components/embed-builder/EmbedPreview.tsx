import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { Eye, Code } from "lucide-react";

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

interface EmbedPreviewProps {
  embedData: EmbedData;
  showRawView: boolean;
}

// Placeholder data for variables
const VARIABLE_PLACEHOLDERS: Record<string, string> = {
  "{user.name}": "John Doe",
  "{user.mention}": "@JohnDoe",
  "{user.id}": "123456789",
  "{user.display_avatar.url}": "https://cdn.discordapp.com/embed/avatars/0.png",
  "{level}": "42",
  "{xp}": "3500",
  "{xp_needed}": "1200",
  "{timestamp}": new Date().toLocaleString(),
  "{date}": new Date().toLocaleDateString(),
  "{time}": new Date().toLocaleTimeString(),
};

function substituteVariables(text: string): string {
  let result = text;
  for (const [variable, value] of Object.entries(VARIABLE_PLACEHOLDERS)) {
    result = result.replace(new RegExp(variable.replace(/[{}]/g, "\\$&"), "g"), value);
  }
  return result;
}

export default function EmbedPreview({ embedData, showRawView }: EmbedPreviewProps) {
  const colorHex = "#" + embedData.color.toString(16).padStart(6, "0");

  if (showRawView) {
    return (
      <Card className="glass-card border-white/10 rounded-2xl overflow-hidden sticky top-6">
        <div className="border-b border-white/5 p-4">
          <div className="flex items-center gap-2">
            <Code className="h-4 w-4 text-purple-400" />
            <h3 className="text-sm font-mono uppercase tracking-wider text-white/60">
              JSON Preview
            </h3>
          </div>
        </div>
        <ScrollArea className="h-[calc(100vh-280px)]">
          <pre className="p-6 text-xs font-mono text-white/80 leading-relaxed">
            {JSON.stringify(embedData, null, 2)}
          </pre>
        </ScrollArea>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-white/10 rounded-2xl overflow-hidden sticky top-6">
      <div className="border-b border-white/5 p-4">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-purple-400" />
          <h3 className="text-sm font-mono uppercase tracking-wider text-white/60">
            Live Preview
          </h3>
        </div>
      </div>
      <ScrollArea className="h-[calc(100vh-280px)]">
        <div className="p-6">
          {/* Discord Embed Container */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#2b2d31] rounded-md overflow-hidden"
            style={{
              borderLeft: `4px solid ${colorHex}`,
            }}
          >
            <div className="p-4 space-y-2">
              {/* Author */}
              {embedData.author?.name && (
                <div className="flex items-center gap-2 mb-2">
                  {embedData.author.icon_url && (
                    <img
                      src={substituteVariables(embedData.author.icon_url)}
                      alt="author"
                      className="w-6 h-6 rounded-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://cdn.discordapp.com/embed/avatars/0.png";
                      }}
                    />
                  )}
                  <span className="text-sm font-semibold text-white">
                    {substituteVariables(embedData.author.name)}
                  </span>
                </div>
              )}

              {/* Title */}
              {embedData.title && (
                <div className="text-white font-semibold">
                  {substituteVariables(embedData.title)}
                </div>
              )}

              {/* Description */}
              {embedData.description && (
                <div className="text-[#dbdee1] text-sm whitespace-pre-wrap">
                  {substituteVariables(embedData.description)}
                </div>
              )}

              {/* Fields */}
              {embedData.fields.length > 0 && (
                <div className="grid gap-2 mt-2">
                  {embedData.fields.map((field, index) => (
                    <div
                      key={index}
                      className={
                        field.inline && index < embedData.fields.length - 1 && embedData.fields[index + 1]?.inline
                          ? "inline-block w-[calc(50%-8px)] align-top mr-2"
                          : "block"
                      }
                    >
                      <div className="font-semibold text-white text-sm mb-1">
                        {substituteVariables(field.name)}
                      </div>
                      <div className="text-[#dbdee1] text-sm">
                        {substituteVariables(field.value)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Thumbnail */}
              {embedData.thumbnail?.url && (
                <div className="float-right ml-4 mt-2">
                  <img
                    src={substituteVariables(embedData.thumbnail.url)}
                    alt="thumbnail"
                    className="w-20 h-20 rounded object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://cdn.discordapp.com/embed/avatars/0.png";
                    }}
                  />
                </div>
              )}

              {/* Image */}
              {embedData.image?.url && (
                <div className="mt-4 clear-both">
                  <img
                    src={substituteVariables(embedData.image.url)}
                    alt="embed"
                    className="rounded max-w-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}

              {/* Footer */}
              {embedData.footer?.text && (
                <div className="flex items-center gap-2 mt-4 pt-2 border-t border-white/5">
                  {embedData.footer.icon_url && (
                    <img
                      src={substituteVariables(embedData.footer.icon_url)}
                      alt="footer"
                      className="w-5 h-5 rounded-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                  <span className="text-xs text-[#949ba4]">
                    {substituteVariables(embedData.footer.text)}
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Helper Text */}
          <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
            <p className="text-xs text-white/50 font-mono">
              Variables are shown with placeholder values. In Discord, they'll be replaced with
              actual data.
            </p>
          </div>
        </div>
      </ScrollArea>
    </Card>
  );
}
