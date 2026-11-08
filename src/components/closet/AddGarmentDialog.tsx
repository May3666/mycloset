import { ImagePlus, RefreshCw } from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { categories, colors, seasons } from "@/lib/demo-data";
import { PrimaryButton } from "@/components/closet/ui";

const selectClassName =
  "h-11 w-full rounded-xl border border-input bg-card px-3 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring";

export function AddGarmentDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const uploadId = useId();

  useEffect(() => {
    if (!image) {
      setPreview(null);
      return;
    }

    const url = URL.createObjectURL(image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setImage(null);
      formRef.current?.reset();
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[92vh] max-w-xl gap-0 overflow-y-auto rounded-3xl bg-card p-0 shadow-lift">
        <DialogHeader className="border-b px-6 py-6 text-left sm:px-8">
          <DialogTitle className="font-display text-2xl font-medium">Agregar una prenda</DialogTitle>
          <DialogDescription className="mt-1">
            Sube una foto y agrega los detalles para identificarla en tu armario.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="px-6 py-6 sm:px-8">
          <div>
            <Label htmlFor={uploadId}>Foto de la prenda</Label>
            <div className="relative mt-2 overflow-hidden rounded-2xl border border-dashed bg-secondary">
              <input
                id={uploadId}
                name="image"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="peer sr-only"
                onChange={(event) => setImage(event.target.files?.[0] ?? null)}
              />
              {preview ? (
                <div className="relative h-56">
                  <img src={preview} alt="Vista previa de la prenda" className="h-full w-full object-contain" />
                  <Label
                    htmlFor={uploadId}
                    className="absolute inset-x-4 bottom-4 flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-full bg-card/95 px-4 text-xs shadow-soft backdrop-blur transition hover:bg-card"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Cambiar imagen
                  </Label>
                </div>
              ) : (
                <Label
                  htmlFor={uploadId}
                  className="flex min-h-44 cursor-pointer flex-col items-center justify-center px-6 py-8 text-center transition hover:bg-sage-soft/50 peer-focus-visible:ring-2 peer-focus-visible:ring-ring"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sage-soft text-primary">
                    <ImagePlus className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <span className="mt-3 text-sm font-medium text-foreground">Sube una foto de tu prenda</span>
                  <span className="mt-1 text-xs font-normal text-muted-foreground">PNG, JPG o WEBP</span>
                </Label>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="garment-brand">
                Marca <span className="font-normal text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="garment-brand"
                name="brand"
                placeholder="Ej. Zara"
                autoComplete="off"
                className="h-11 rounded-xl bg-card"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="garment-category">Categoría</Label>
              <select id="garment-category" name="category" required defaultValue="" className={selectClassName}>
                <option value="" disabled>
                  Selecciona una categoría
                </option>
                {categories.slice(1).map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="garment-color">
                Color <span className="font-normal text-muted-foreground">(opcional)</span>
              </Label>
              <select id="garment-color" name="color" defaultValue="" className={selectClassName}>
                <option value="">Selecciona un color</option>
                {colors.slice(1).map((color) => (
                  <option key={color} value={color}>
                    {color}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="garment-season">
                Temporada <span className="font-normal text-muted-foreground">(opcional)</span>
              </Label>
              <select id="garment-season" name="season" defaultValue="" className={selectClassName}>
                <option value="">Selecciona una temporada</option>
                {seasons.slice(1).map((season) => (
                  <option key={season} value={season}>
                    {season}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <DialogClose asChild>
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center rounded-full border bg-card px-5 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Cancelar
              </button>
            </DialogClose>
            <PrimaryButton type="submit">Guardar prenda</PrimaryButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
