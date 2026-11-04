import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Plus, Sparkles } from "lucide-react";
import { AppShell } from "@/components/closet/AppShell";
import { DemoBadge, GarmentCard } from "@/components/closet/ui";
import { garments, outfits } from "@/lib/demo-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Inicio · MyCloset – Tu armario digital" },
      { name: "description", content: "Organiza tu guardarropa, descubre nuevas combinaciones y aprovecha cada prenda." },
      { property: "og:title", content: "MyCloset – Tu armario digital" },
      { property: "og:description", content: "Organiza tu guardarropa y crea outfits con la ropa que ya tienes." },
    ],
  }),
  component: Index,
});

function Index() {
  const stats = [
    { label: "Total de prendas", value: garments.length },
    { label: "Outfits creados", value: outfits.length },
    { label: "Categorías utilizadas", value: new Set(garments.map((g) => g.category)).size },
    { label: "Categoría principal", value: "Superiores" },
  ];
  return (
    <AppShell>
      <section className="mb-10">
        <DemoBadge />
        <h1 className="mt-4 text-4xl leading-tight sm:text-5xl">Tu estilo, a tu manera.</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Organiza tu guardarropa, descubre nuevas combinaciones y aprovecha cada prenda.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-card p-5 shadow-soft">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-3 font-display text-2xl text-foreground sm:text-3xl">{s.value}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <QuickAction to="/wardrobe" icon={<Plus className="h-5 w-5" />} title="Agregar prenda" text="Suma una nueva pieza a tu armario." />
        <QuickAction to="/outfits" icon={<Sparkles className="h-5 w-5" />} title="Crear outfit" text="Combina prendas en un nuevo look." />
      </section>

      <section className="mt-12">
        <div className="mb-5 flex items-end justify-between">
          <h2 className="text-2xl">Últimas prendas</h2>
          <Link to="/wardrobe" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
            Ver todo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {garments.slice(0, 4).map((g) => (
            <GarmentCard key={g.id} garment={g} />
          ))}
        </div>
      </section>
    </AppShell>
  );
}

function QuickAction({ to, icon, title, text }: { to: "/wardrobe" | "/outfits"; icon: React.ReactNode; title: string; text: string }) {
  return (
    <Link to={to} className="group flex items-center gap-4 rounded-2xl bg-sage-soft p-5 transition hover:shadow-soft">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">{icon}</span>
      <span className="flex-1">
        <span className="block font-medium text-foreground">{title}</span>
        <span className="block text-sm text-muted-foreground">{text}</span>
      </span>
      <ArrowRight className="h-5 w-5 text-primary transition group-hover:translate-x-1" />
    </Link>
  );
}
