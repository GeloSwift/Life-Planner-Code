/**
 * Composant de décoration de fond réutilisable.
 * 
 * Affiche les mêmes effets visuels (gradients, cercles flous) sur toutes les pages
 * pour une cohérence visuelle.
 */

export function BackgroundDecorations() {
  return (
    <div className="fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      <div className="absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-accent/10 blur-3xl" />
    </div>
  );
}

