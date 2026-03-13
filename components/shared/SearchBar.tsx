"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  /** Debounce delay in ms (default 300) */
  debounceMs?: number;
  /** Large variant for search page */
  size?: "default" | "lg";
}

export function SearchBar({
  value: controlledValue,
  onChange,
  placeholder = "Search GetWired...",
  className,
  autoFocus = false,
  debounceMs = 300,
  size = "default",
}: SearchBarProps) {
  const [internalValue, setInternalValue] = useState(controlledValue ?? "");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const currentValue = controlledValue ?? internalValue;

  const debouncedOnChange = useCallback(
    (val: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onChange?.(val);
      }, debounceMs);
    },
    [onChange, debounceMs]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (controlledValue === undefined) {
      setInternalValue(val);
    }
    debouncedOnChange(val);
  };

  const handleClear = () => {
    if (controlledValue === undefined) {
      setInternalValue("");
    }
    onChange?.("");
    inputRef.current?.focus();
  };

  // Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className={cn("relative", className)} data-testid="search-bar">
      <Search
        className={cn(
          "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none",
          size === "lg" ? "size-5" : "size-4"
        )}
      />
      <Input
        ref={inputRef}
        value={currentValue}
        onChange={handleChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        data-testid="search-input"
        aria-label="Search"
        className={cn(
          "pl-10 pr-10 bg-muted/50 border-border focus-visible:border-[#3B82F6]/50 focus-visible:ring-[#3B82F6]/20",
          size === "lg" ? "h-12 text-base rounded-xl" : "h-8 text-sm"
        )}
      />
      {currentValue && (
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          data-testid="search-clear"
          aria-label="Clear search"
        >
          <X className="size-3.5" />
        </Button>
      )}
    </div>
  );
}
