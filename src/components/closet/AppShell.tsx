import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Shirt, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

const nav = [
  { to: "/", label: "Inicio", icon: Home },
  { to: "/wardrobe", label: "Mi armario", icon: Shirt },
  { to: "/outfits", label: "Mis outfits", icon: Sparkles },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string) => (to === "/" ? path === "/" : path.startsWith(to));

  return (
    <div className="min-h-screen w-full">
      {/* Sidebar escritorio */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r bg-card px-5 py-8 lg:flex">
        <Link to="/" className="px-3 font-display text-2xl text-foreground">
          My<span className="text-primary">Closet</span>
        </Link>
        <p className="px-3 pt-1 text-xs text-muted-foreground">Tu armario digital</p>
        <nav className="mt-10 flex flex-col gap-1" aria-label="Principal">
          {nav.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                isActive(to)
                  ? "bg-sage-soft font-medium text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl bg-secondary p-4 text-xs text-muted-foreground">
          Versión de diseño · datos demostrativos
        </div>
      </aside>

      {/* Barra superior móvil */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-card/90 px-5 py-4 backdrop-blur lg:hidden">
        <Link to="/" className="font-display text-xl">
          My<span className="text-primary">Closet</span>
        </Link>
      </header>

      <main className="pb-24 lg:pb-0 lg:pl-64">
        <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:px-12 lg:py-12">{children}</div>
      </main>

      {/* Navegación inferior móvil */}
      <nav
        aria-label="Principal móvil"
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-3 border-t bg-card/95 backdrop-blur lg:hidden"
      >
        {nav.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={`flex flex-col items-center gap-1 py-3 text-xs ${
              isActive(to) ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <span className={`rounded-full px-4 py-1 ${isActive(to) ? "bg-sage-soft" : ""}`}>
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </span>
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between lg:mb-10">
      <div>
        <h1 className="text-3xl text-foreground sm:text-4xl">{title}</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}
