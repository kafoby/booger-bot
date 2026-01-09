import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { EmbedTemplate, InsertEmbedTemplate, CommandTemplateMapping, InsertCommandTemplateMapping } from "@shared/schema";

// Embed Template Hooks

export function useEmbedTemplates() {
  return useQuery<EmbedTemplate[]>({
    queryKey: ["/api/embed-templates"],
  });
}

export function useEmbedTemplate(id: number) {
  return useQuery<EmbedTemplate>({
    queryKey: [`/api/embed-templates/${id}`],
    enabled: !!id,
  });
}

export function useCreateEmbedTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (template: InsertEmbedTemplate) => {
      const res = await fetch("/api/embed-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(template),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to create template");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/embed-templates"] });
    },
  });
}

export function useUpdateEmbedTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, template }: { id: number; template: Partial<InsertEmbedTemplate> }) => {
      const res = await fetch(`/api/embed-templates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(template),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to update template");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/embed-templates"] });
    },
  });
}

export function useDeleteEmbedTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/embed-templates/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to delete template");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/embed-templates"] });
    },
  });
}

// Command Template Mapping Hooks

export function useCommandMappings() {
  return useQuery<CommandTemplateMapping[]>({
    queryKey: ["/api/command-template-mappings"],
  });
}

export function useCreateCommandMapping() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mapping: InsertCommandTemplateMapping) => {
      const res = await fetch("/api/command-template-mappings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mapping),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to create mapping");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/command-template-mappings"] });
    },
  });
}

export function useUpdateCommandMapping() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, mapping }: { id: number; mapping: Partial<InsertCommandTemplateMapping> }) => {
      const res = await fetch(`/api/command-template-mappings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mapping),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to update mapping");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/command-template-mappings"] });
    },
  });
}

export function useDeleteCommandMapping() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/command-template-mappings/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to delete mapping");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/command-template-mappings"] });
    },
  });
}

// Embed Variables Hook

export interface EmbedVariable {
  name: string;
  description: string;
  example: string;
}

export interface EmbedVariables {
  user: EmbedVariable[];
  leveling: EmbedVariable[];
  timestamp: EmbedVariable[];
}

export function useEmbedVariables() {
  return useQuery<EmbedVariables>({
    queryKey: ["/api/embed-variables"],
  });
}
