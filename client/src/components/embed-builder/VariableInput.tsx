import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useEmbedVariables } from "@/hooks/use-embed-templates";

interface VariableInputProps {
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  className?: string;
  placeholder?: string;
  minHeight?: string;
}

export function VariableInput({
  value,
  onChange,
  multiline = false,
  className,
  placeholder,
  minHeight,
}: VariableInputProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const { data: variables } = useEmbedVariables();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    const cursorPosition = e.target.selectionStart || 0;
    const textBeforeCursor = newValue.slice(0, cursorPosition);
    const lastOpenBraceIndex = textBeforeCursor.lastIndexOf("{");

    if (lastOpenBraceIndex !== -1) {
      const textAfterBrace = textBeforeCursor.slice(lastOpenBraceIndex + 1);
      // Check if there is a closing brace before the cursor (meaning the brace is closed)
      // or if there are spaces (variables usually don't have spaces, but let's be lenient or strict as needed)
      // Let's assume variables are single words or dot.separated
      if (!textAfterBrace.includes("}") && !textAfterBrace.includes(" ")) {
        setQuery(textAfterBrace);
        setOpen(true);
        return;
      }
    }
    setOpen(false);
  };

  const handleSelect = (variableName: string) => {
    const cursorPosition = inputRef.current?.selectionStart || 0;
    const textBeforeCursor = value.slice(0, cursorPosition);
    const lastOpenBraceIndex = textBeforeCursor.lastIndexOf("{");

    if (lastOpenBraceIndex !== -1) {
      const prefix = value.slice(0, lastOpenBraceIndex);
      const suffix = value.slice(cursorPosition);
      // If the user already typed part of the variable, we replace it
      const newValue = `${prefix}{${variableName}}${suffix}`;
      onChange(newValue);
      setOpen(false);

      // Restore focus and move cursor
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          // Calculate new cursor position: prefix + {variableName} + }
          // Actually the variableName is inserted inside {} which we added
          // Wait, we are adding {variableName} including the braces? 
          // The trigger was {.
          // So prefix ends right before {.
          // So we are replacing `{partial` with `{variableName}`.
          // Yes.
          
          const newCursorPos = prefix.length + variableName.length + 2; // +2 for {}
          inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    }
  };

  // Filter variables based on query
  const filteredVariables = variables
    ? Object.entries(variables).reduce((acc, [category, vars]) => {
        const filtered = vars.filter((v: any) =>
          v.name.toLowerCase().includes(query.toLowerCase())
        );
        if (filtered.length > 0) {
          acc[category] = filtered;
        }
        return acc;
      }, {} as Record<string, any[]>)
    : {};

  const hasResults = Object.keys(filteredVariables).length > 0;

  return (
    <Popover open={open && hasResults} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="w-full relative">
          {multiline ? (
            <Textarea
              ref={inputRef as any}
              value={value}
              onChange={handleInputChange}
              className={className}
              placeholder={placeholder}
              style={{ minHeight }}
            />
          ) : (
            <Input
              ref={inputRef as any}
              value={value}
              onChange={handleInputChange}
              className={className}
              placeholder={placeholder}
            />
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 w-[300px] max-h-[300px]"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command shouldFilter={false}>
          <CommandList>
            <CommandEmpty>No variable found.</CommandEmpty>
            {Object.entries(filteredVariables).map(([category, vars]) => (
              <CommandGroup key={category} heading={category}>
                {vars.map((v: any) => (
                  <CommandItem
                    key={v.name}
                    value={v.name}
                    onSelect={() => handleSelect(v.name)}
                    className="cursor-pointer"
                  >
                    <span>{v.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground truncate opacity-50">
                      {v.description}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
