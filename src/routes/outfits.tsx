import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { AppShell, PageHeader } from "@/components/closet/AppShell";
import { DemoBadge, EmptyOutfits, OutfitCard, PrimaryButton } from "@/components/closet/ui";
import { outfits } from "@/lib/demo-data";

export const Route = createFileRoute("/outfits")({
  head: () => ({
    meta: [
      { title: "Mis outfits · MyCloset" },
      { name: "description", content: "Crea combinaciones únicas con las prendas de tu armario." },
      { property: "og:title", content: "Mis outfits · MyCloset" },
      { property: "og:description", content: "Crea combinaciones únicas con las prendas de tu armario." },
    ],
  }),
  component: Outfits,
});

function Outfits() {
  return (
    <AppShell>
      <PageHeader
        title="Mis outfits"
        subtitle="Crea combinaciones únicas con las prendas de tu armario."
        action={<PrimaryButton><Plus className="h-4 w-4" />Crear outfit</PrimaryButton>}
      />
      <div className="mb-4"><DemoBadge /></div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {outfits.map((o) => (
          <OutfitCard key={o.id} outfit={o} />
        ))}
      </div>

      <section className="mt-16 max-w-md">
        <h2 className="mb-5 text-xl text-muted-foreground">Vista previa de estado vacío</h2>
        <EmptyOutfits />
      </section>
    </AppShell>
  );
}
