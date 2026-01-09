"use client";

/**
 * Bouton pour basculer entre le mode clair et sombre.
 */

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Éviter l'erreur d'hydratation en attendant le montage côté client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Toujours rendre le même bouton pour éviter le mismatch SSR/client
  // Les icônes sont masquées par défaut et s'affichent après le montage
  const isDark = mounted && resolvedTheme === "dark";
  const isLight = mounted && resolvedTheme === "light";

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9 relative overflow-hidden"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <Sun
        className={`h-4 w-4 absolute transition-all duration-300 ${!mounted
            ? "opacity-0"
            : isLight
              ? "rotate-0 scale-100 opacity-100"
              : "rotate-90 scale-0 opacity-0"
          }`}
      />
      <Moon
        className={`h-4 w-4 absolute transition-all duration-300 ${!mounted
            ? "opacity-0"
            : isDark
              ? "rotate-0 scale-100 opacity-100"
              : "-rotate-90 scale-0 opacity-0"
          }`}
      />
      <span className="sr-only">
        {isDark ? "Activer le mode clair" : "Activer le mode sombre"}
      </span>
    </Button>
  );
}

