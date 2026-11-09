import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Plus, Sparkles } from "lucide-react";
import { AppShell } from "@/components/closet/AppShell";
import { GarmentCard } from "@/components/closet/ui";
import { useGarments } from "@/lib/garment-store";

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
  const { garments } = useGarments();

  return (
    <AppShell>
      <section className="mb-10">
        <h1 className="text-4xl leading-tight sm:text-5xl">Tu estilo, a tu manera.</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Organiza tu guardarropa, descubre nuevas combinaciones y aprovecha cada prenda.
        </p>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <QuickAction
          to="/wardrobe"
          icon={<Plus className="h-5 w-5" />}
          title="Agregar prenda"
          text="Suma una nueva pieza a tu armario."
        />
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

function QuickAction({ to, icon, title, text }: { to?: "/wardrobe" | "/outfits"; icon: React.ReactNode; title: string; text: string }) {
  const className = "group flex w-full items-center gap-4 rounded-2xl bg-sage-soft p-5 text-left transition hover:shadow-soft";
  const content = (
    <>
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">{icon}</span>
      <span className="flex-1">
        <span className="block font-medium text-foreground">{title}</span>
        <span className="block text-sm text-muted-foreground">{text}</span>
      </span>
      <ArrowRight className="h-5 w-5 text-primary transition group-hover:translate-x-1" />
    </>
  );

  return to ? (
    <Link to={to} className={className}>
      {content}
    </Link>
  ) : (
    <button type="button" className={className}>
      {content}
    </button>
  );
}
