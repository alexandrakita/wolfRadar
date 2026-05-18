import { cn } from "@/lib/utils";

export function PageHeading({ title, description, className, actions }) {
  if (actions != null && actions !== false) {
    return (
      <div
        className={cn("mb-6 sm:mb-8 flex flex-wrap items-start justify-between gap-4", className)}
      >
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
          {description != null && (
            <p className="mt-2 text-muted-foreground">{description}</p>
          )}
        </div>
        {actions}
      </div>
    );
  }

  return (
    <div className={cn("mb-6 sm:mb-8", className)}>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      {description != null && (
        <p className="mt-2 text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
