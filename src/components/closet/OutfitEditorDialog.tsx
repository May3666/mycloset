import { LoaderCircle } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { PrimaryButton } from "@/components/closet/ui";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGarments } from "@/lib/garment-store";
import type { Garment, Outfit } from "@/lib/demo-data";

const selectGarmentClass =
  "flex cursor-pointer items-center gap-3 rounded-xl border bg-card p-3 transition hover:border-sage has-[:checked]:border-primary has-[:checked]:bg-sage-soft/40";

export function OutfitEditorDialog({
  outfit,
  garments,
  open,
  onClose,
}: {
  outfit: Outfit | null;
  garments: Garment[];
  open: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [occasion, setOccasion] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { addOutfit, updateOutfit } = useGarments();

  useEffect(() => {
    if (!open) return;
    setName(outfit?.name ?? "");
    setOccasion(outfit?.occasion ?? "");
    setSelectedIds(outfit?.garmentIds ?? []);
    setError("");
  }, [open, outfit]);

  const toggleGarment = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id],
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;

    const garmentIds = selectedIds.filter((id) => garments.some((garment) => garment.id === id));
    if (garmentIds.length === 0) {
      setError("Selecciona al menos una prenda para guardar el outfit.");
      return;
    }

    const nextOutfit: Outfit = {
      id: outfit?.id ?? `o-${crypto.randomUUID()}`,
      name: name.trim(),
      occasion: occasion.trim(),
      garmentIds,
    };
    setIsSaving(true);
    setError("");
    try {
      if (outfit) await updateOutfit(nextOutfit);
      else await addOutfit(nextOutfit);
      onClose();
    } catch {
      setError("No se pudo guardar el outfit. Inténtalo de nuevo.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-xl gap-0 overflow-y-auto rounded-3xl bg-card p-0 shadow-lift">
        <DialogHeader className="border-b px-6 py-6 text-left sm:px-8">
          <DialogTitle className="font-display text-2xl font-medium">
            {outfit ? "Editar outfit" : "Crear outfit"}
          </DialogTitle>
          <DialogDescription>
            {outfit ? "Actualiza los datos y las prendas de esta combinación." : "Elige las prendas que quieres combinar."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 py-6 sm:px-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="outfit-name">Nombre</Label>
              <Input
                id="outfit-name"
                value={name}
                onChange={(event) => setName(event.currentTarget.value)}
                placeholder="Ej. Casual de fin de semana"
                required
                maxLength={80}
                className="h-11 rounded-xl bg-card"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="outfit-occasion">Ocasión</Label>
              <Input
                id="outfit-occasion"
                value={occasion}
                onChange={(event) => setOccasion(event.currentTarget.value)}
                placeholder="Ej. Casual"
                required
                maxLength={40}
                className="h-11 rounded-xl bg-card"
              />
            </div>
          </div>

          <fieldset className="mt-6">
            <legend className="text-sm font-medium text-foreground">Prendas</legend>
            {garments.length === 0 ? (
              <p className="mt-3 rounded-xl bg-secondary p-4 text-sm text-muted-foreground">
                Agrega prendas a tu armario antes de crear un outfit.
              </p>
            ) : (
              <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
                {garments.map((garment) => (
                  <label key={garment.id} htmlFor={`outfit-garment-${garment.id}`} className={selectGarmentClass}>
                    <input
                      id={`outfit-garment-${garment.id}`}
                      type="checkbox"
                      checked={selectedIds.includes(garment.id)}
                      onChange={() => toggleGarment(garment.id)}
                      className="h-4 w-4 shrink-0 accent-primary"
                    />
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-secondary p-1">
                      <img src={garment.image} alt="" className="h-full w-full object-contain" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-foreground">{garment.name}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {garment.category}{garment.color ? ` · ${garment.color}` : ""}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </fieldset>

          {error && <p className="mt-4 text-sm text-destructive" role="alert">{error}</p>}

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <DialogClose asChild>
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center rounded-full border bg-card px-5 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Cancelar
              </button>
            </DialogClose>
            <PrimaryButton type="submit" disabled={isSaving || garments.length === 0}>
              {isSaving && <LoaderCircle className="h-4 w-4 animate-spin" />}
              {isSaving ? "Guardando..." : outfit ? "Guardar cambios" : "Guardar outfit"}
            </PrimaryButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}