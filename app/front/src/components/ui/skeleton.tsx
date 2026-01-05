import { cn } from "@/lib/utils"

type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted",
        className
      )}
      {...props}
    />
  )
}

// Composants Skeleton spécifiques pour les patterns courants

function SkeletonCard({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("rounded-lg border bg-card p-6", className)} {...props}>
      <div className="space-y-3">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  )
}

function SkeletonStatCard({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("rounded-lg border bg-card p-4 sm:p-6", className)} {...props}>
      <div className="flex items-center gap-3 sm:gap-4">
        <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-12" />
        </div>
      </div>
    </div>
  )
}

function SkeletonSessionCard({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("rounded-lg border bg-card overflow-hidden", className)} {...props}>
      <Skeleton className="w-full aspect-video" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex justify-between pt-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    </div>
  )
}

function SkeletonExerciseCard({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("rounded-lg border bg-card overflow-hidden", className)} {...props}>
      <Skeleton className="w-full aspect-video" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-3 w-full" />
        <div className="flex items-center gap-2 pt-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  )
}

function SkeletonChart({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("rounded-lg border bg-card p-4 sm:p-6", className)} {...props}>
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-8 w-16" />
      </div>
      <Skeleton className="h-[200px] w-full" />
    </div>
  )
}

function SkeletonCalendar({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("rounded-lg border bg-card p-4 sm:p-6", className)} {...props}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-24" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-6 w-full" />
        ))}
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={`day-${i}`} className="h-10 w-full" />
        ))}
      </div>
    </div>
  )
}

function SkeletonGoalCard({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("flex items-center gap-4 p-3 rounded-lg border", className)} {...props}>
      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
      <Skeleton className="h-5 w-12" />
    </div>
  )
}

// Skeleton pour la page dashboard
function SkeletonDashboard() {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      {/* Features */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-20" />
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} className="h-[180px]" />
          ))}
        </div>
      </div>
    </div>
  )
}

// Skeleton pour la page workout
function SkeletonWorkoutDashboard() {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>

      {/* Stats */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <SkeletonCalendar />
        <div className="space-y-4 sm:space-y-6">
          <div className="rounded-lg border bg-card p-4">
            <div className="space-y-3">
              <Skeleton className="h-5 w-24" />
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonGoalCard key={i} />
              ))}
            </div>
          </div>
          <SkeletonChart />
        </div>
      </div>
    </div>
  )
}

// Skeleton pour la liste des séances
function SkeletonSessionsList() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>

      {/* Filters */}
      <div className="rounded-lg border bg-card p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonSessionCard key={i} />
        ))}
      </div>
    </div>
  )
}

// Skeleton pour la liste des exercices
function SkeletonExercisesList() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-24" />
      </div>

      {/* Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonExerciseCard key={i} />
        ))}
      </div>
    </div>
  )
}

// Skeleton pour la page profil
function SkeletonProfile() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Avatar Card */}
      <div className="rounded-lg border bg-card p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="flex items-center gap-6">
            <Skeleton className="h-24 w-24 rounded-full shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        </div>
      </div>

      {/* Name Card */}
      <div className="rounded-lg border bg-card p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>
      </div>

      {/* Google Calendar Card */}
      <div className="rounded-lg border bg-card p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-5 w-32" />
            </div>
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-48" />
        </div>
      </div>

      {/* Account Info Card */}
      <div className="rounded-lg border bg-card p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export {
  Skeleton,
  SkeletonCard,
  SkeletonStatCard,
  SkeletonSessionCard,
  SkeletonExerciseCard,
  SkeletonChart,
  SkeletonCalendar,
  SkeletonGoalCard,
  SkeletonDashboard,
  SkeletonWorkoutDashboard,
  SkeletonSessionsList,
  SkeletonExercisesList,
  SkeletonProfile,
}

