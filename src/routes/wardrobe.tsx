import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { AddGarmentDialog } from "@/components/closet/AddGarmentDialog";
import { AppShell, PageHeader } from "@/components/closet/AppShell";
import { EmptyGarments, EmptySearch, FilterChips, GarmentCard, PrimaryButton, SearchBar } from "@/components/closet/ui";
import { categories, colors, filterGarments, seasons } from "@/lib/demo-data";
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
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [color, setColor] = useState(colors[0]);
  const [season, setSeason] = useState(seasons[0]);
  const filteredGarments = filterGarments(garments, {
    query,
    category: category === categories[0] ? null : category,
    color: color === colors[0] ? null : color,
    season: season === seasons[0] ? null : season,
  });

  const clearFilters = () => {
    setQuery("");
    setCategory(categories[0]);
    setColor(colors[0]);
    setSeason(seasons[0]);
  };

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
          <SearchBar placeholder="Buscar prendas..." value={query} onChange={setQuery} />
        </div>
        <FilterChips label="Categoría" options={categories} selected={category} onChange={setCategory} />
        <FilterChips label="Color" options={colors} selected={color} onChange={setColor} />
        <FilterChips label="Temporada" options={seasons} selected={season} onChange={setSeason} />
      </div>
      {garments.length === 0 ? (
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
      ) : filteredGarments.length === 0 ? (
        <EmptySearch onClear={clearFilters} />
      ) : (
        <div className="grid grid-cols-1 gap-5 min-[420px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {filteredGarments.map((garment) => (
            <GarmentCard key={garment.id} garment={garment} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
