"use client";

import * as React from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const themes = [
  { value: "light", label: "Light theme", icon: Sun },
  { value: "dark", label: "Dark theme", icon: Moon },
  { value: "system", label: "System theme", icon: Monitor },
] as const;

type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={cn(
          "inline-flex h-9 w-[6.25rem] items-center rounded-md border bg-background p-0.5",
          className
        )}
        aria-hidden
      />
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border bg-background p-0.5",
        className
      )}
      role="group"
      aria-label="Theme"
    >
      {themes.map(({ value, label, icon: Icon }) => (
        <Button
          key={value}
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "size-8 px-0",
            theme === value && "bg-accent text-accent-foreground"
          )}
          aria-label={label}
          aria-pressed={theme === value}
          onClick={() => setTheme(value)}
        >
          <Icon className="size-4" />
        </Button>
      ))}
    </div>
  );
}
