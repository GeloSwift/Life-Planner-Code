/**
 * Layout pour les pages d'authentification.
 * 
 * Ce layout est utilisé pour /login, /register, etc.
 * Il ne nécessite pas d'authentification.
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

