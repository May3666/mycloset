import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { AddGarmentDialog } from "@/components/closet/AddGarmentDialog";
import { AppShell, PageHeader } from "@/components/closet/AppShell";
import { EmptyGarments, EmptySearch, FilterChips, GarmentCard, PrimaryButton, SearchBar } from "@/components/closet/ui";
import { categories, colors, seasons } from "@/lib/demo-data";
import { useGarments } from "@/lib/garment-store";

export const Route = createFileRoute("/wardrobe")({
  head: () => ({
    meta: [
      { title: "Mi armario · MyCloset" },
      { name: "description", content: "Todas tus prendas favoritas, organizadas en un solo lugar." },
      { property: "og:title", content: "Mi armario · MyCloset" },
      { property: "og:description", content: "Todas tus prendas favoritas, organizadas en un solo lugar." },
    ],
  }),
  component: Wardrobe,
});

function Wardrobe() {
  const { garments } = useGarments();

  return (
    <AppShell>
      <PageHeader
        title="Mi armario"
        subtitle="Todas tus prendas favoritas, organizadas en un solo lugar."
        action={
          <AddGarmentDialog
            trigger={
              <PrimaryButton>
                <Plus className="h-4 w-4" />
                Agregar prenda
              </PrimaryButton>
            }
          />
        }
      />
      <div className="mb-8 space-y-4">
        <div className="flex items-center gap-3">
          <SearchBar placeholder="Buscar prendas..." />
        </div>
        <FilterChips label="Categoría" options={categories} />
        <FilterChips label="Color" options={colors} />
        <FilterChips label="Temporada" options={seasons} />
      </div>
      <div className="grid grid-cols-1 gap-5 min-[420px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {garments.map((g) => (
          <GarmentCard key={g.id} garment={g} />
        ))}
      </div>

      <section className="mt-16">
        <h2 className="mb-5 text-xl text-muted-foreground">Vista previa de estados vacíos</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <EmptyGarments
            action={
              <AddGarmentDialog
                trigger={
                  <PrimaryButton>
                    <Plus className="h-4 w-4" />
                    Agregar prenda
                  </PrimaryButton>
                }
              />
            }
          />
          <EmptySearch />
        </div>
      </section>
    </AppShell>
  );
}
