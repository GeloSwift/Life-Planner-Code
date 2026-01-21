/**
 * Footer réutilisable pour toutes les pages.
 */

import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t py-8">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:flex-row">
        <p>© 2026 My Life Planner. Tous droits réservés.</p>
        <div className="flex gap-6">
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Confidentialité
          </Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">
            Conditions
          </Link>
        </div>
      </div>
    </footer>
  );
}

