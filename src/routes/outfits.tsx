import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/closet/AppShell";
import { OutfitDialog } from "@/components/closet/OutfitDialog";
import { DemoBadge, EmptyOutfits, OutfitCard, PrimaryButton } from "@/components/closet/ui";
import { outfits, type Outfit } from "@/lib/demo-data";
import { useGarments } from "@/lib/garment-store";

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
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const { garments } = useGarments();

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
          <OutfitCard key={o.id} outfit={o} garments={garments} onClick={() => setSelectedOutfit(o)} />
        ))}
      </div>

      <section className="mt-16 max-w-md">
        <h2 className="mb-5 text-xl text-muted-foreground">Vista previa de estado vacío</h2>
        <EmptyOutfits />
      </section>
      <OutfitDialog outfit={selectedOutfit} garments={garments} onClose={() => setSelectedOutfit(null)} />
    </AppShell>
  );
}
