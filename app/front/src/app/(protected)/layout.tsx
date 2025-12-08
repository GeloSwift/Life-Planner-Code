/**
 * Layout pour les pages protégées (authentification requise).
 * 
 * Ce layout est utilisé pour /dashboard, /profile, etc.
 * Le middleware s'assure que l'utilisateur est connecté.
 */

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

