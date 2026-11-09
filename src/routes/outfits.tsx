import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/closet/AppShell";
import { OutfitEditorDialog } from "@/components/closet/OutfitEditorDialog";
import { OutfitDialog } from "@/components/closet/OutfitDialog";
import { EmptyOutfits, OutfitCard, PrimaryButton } from "@/components/closet/ui";
import type { Outfit } from "@/lib/demo-data";
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
  const [editingOutfit, setEditingOutfit] = useState<Outfit | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const { garments, outfits, deleteOutfit } = useGarments();

  const handleCreate = () => {
    setEditingOutfit(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (outfit: Outfit) => {
    setSelectedOutfit(null);
    setEditingOutfit(outfit);
    setIsEditorOpen(true);
  };

  const handleDelete = async (outfit: Outfit) => {
    await deleteOutfit(outfit.id);
  };

  return (
    <AppShell>
      <PageHeader
        title="Mis outfits"
        subtitle="Crea combinaciones únicas con las prendas de tu armario."
        action={<PrimaryButton onClick={handleCreate}><Plus className="h-4 w-4" />Crear outfit</PrimaryButton>}
      />
      {outfits.length === 0 ? (
        <EmptyOutfits onCreate={handleCreate} />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {outfits.map((outfit) => (
            <OutfitCard
              key={outfit.id}
              outfit={outfit}
              garments={garments}
              onClick={() => setSelectedOutfit(outfit)}
            />
          ))}
        </div>
      )}
      <OutfitDialog
        outfit={selectedOutfit}
        garments={garments}
        onClose={() => setSelectedOutfit(null)}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      <OutfitEditorDialog
        key={editingOutfit?.id ?? "new-outfit"}
        outfit={editingOutfit}
        garments={garments}
        open={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingOutfit(null);
        }}
      />
    </AppShell>
  );
}
