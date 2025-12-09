"use client";

/**
 * Provider pour le thème clair/sombre.
 * Utilise next-themes pour gérer le thème de manière persistante.
 */

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

