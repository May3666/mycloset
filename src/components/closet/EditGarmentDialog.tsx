import { ImagePlus, LoaderCircle, RefreshCw, Trash2 } from "lucide-react";
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
import { categories, colors, seasons, type Garment } from "@/lib/demo-data";
import { useGarments } from "@/lib/garment-store";

const selectClassName =
  "h-11 w-full rounded-xl border border-input bg-card px-3 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring";
const primaryButtonClassName =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-soft transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
const secondaryButtonClassName =
  "inline-flex min-h-11 items-center justify-center rounded-full border bg-card px-5 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function EditGarmentDialog({ garment, trigger }: { garment: Garment; trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [sourceImage, setSourceImage] = useState<File | null>(null);
  const [processedImage, setProcessedImage] = useState<Blob | null>(null);
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [processingError, setProcessingError] = useState("");
  const [saveError, setSaveError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const uploadId = useId();
  const { updateGarment, deleteGarment } = useGarments();

  useEffect(() => {
    if (!processedImage) {
      setProcessedPreview(null);
      return;
    }

    const url = URL.createObjectURL(processedImage);
    setProcessedPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [processedImage]);

  useEffect(() => () => requestRef.current?.abort(), []);

  const processImage = async (file: File) => {
    requestRef.current?.abort();
    const id = ++requestIdRef.current;
    const controller = new AbortController();
    requestRef.current = controller;
    setSourceImage(file);
    setProcessedImage(null);
    setProcessingError("");
    setSaveError("");
    setIsProcessing(true);

    try {
      const body = new FormData();
      body.append("file", file);
      const endpoint =
        import.meta.env["VITE_BACKGROUND_REMOVAL_API_URL"] || "http://localhost:7000/api/remove-background";
      const response = await fetch(endpoint, { method: "POST", body, signal: controller.signal });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(payload?.detail || "No pudimos eliminar el fondo de la imagen.");
      }

      const result = await response.blob();
      if (result.type !== "image/png") throw new Error("El servicio no devolvió un PNG transparente.");
      if (id === requestIdRef.current) setProcessedImage(result);
    } catch (error) {
      if (controller.signal.aborted) return;
      if (id === requestIdRef.current) {
        setProcessingError(
          error instanceof Error ? error.message : "No pudimos eliminar el fondo. Inténtalo de nuevo.",
        );
      }
    } finally {
      if (id === requestIdRef.current) {
        setIsProcessing(false);
        requestRef.current = null;
      }
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    requestRef.current?.abort();
    requestIdRef.current += 1;
    requestRef.current = null;
    setSourceImage(null);
    setProcessedImage(null);
    setIsProcessing(false);
    setProcessingError("");
    setSaveError("");
    setConfirmDelete(false);
    if (!nextOpen) formRef.current?.reset();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isProcessing || isSaving || isDeleting) return;

    const formData = new FormData(event.currentTarget);
    const brand = String(formData.get("brand") || "").trim();
    setIsSaving(true);
    setSaveError("");
    try {
      await updateGarment(
        garment.id,
        {
          name: String(formData.get("name") || "").trim() || garment.name,
          category: String(formData.get("category")),
          color: String(formData.get("color") || ""),
          season: String(formData.get("season") || ""),
          ...(brand ? { brand } : {}),
        },
        processedImage || undefined,
      );
      handleOpenChange(false);
    } catch {
      setSaveError("No se pudieron guardar los cambios. Inténtalo de nuevo.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    setSaveError("");
    try {
      await deleteGarment(garment.id);
      handleOpenChange(false);
    } catch {
      setSaveError("No se pudo eliminar la prenda. Inténtalo de nuevo.");
      setIsDeleting(false);
    }
  };

  const preview = processedPreview || garment.image;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[92vh] max-w-xl gap-0 overflow-y-auto rounded-3xl bg-card p-0 shadow-lift">
        <DialogHeader className="border-b px-6 py-6 text-left sm:px-8">
          <DialogTitle className="font-display text-2xl font-medium">Editar prenda</DialogTitle>
          <DialogDescription className="mt-1">
            Actualiza la foto o los detalles de {garment.name}.
          </DialogDescription>
        </DialogHeader>

        <form key={`${garment.id}-${open}`} ref={formRef} onSubmit={handleSubmit} className="px-6 py-6 sm:px-8">
          <div>
            <Label htmlFor={uploadId}>Foto de la prenda</Label>
            <div className="relative mt-2 overflow-hidden rounded-2xl bg-secondary">
              <input
                id={uploadId}
                name="image"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="peer sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void processImage(file);
                }}
              />
              {isProcessing ? (
                <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center" role="status">
                  <LoaderCircle className="h-6 w-6 animate-spin text-primary" />
                  <span className="mt-3 text-sm font-medium text-foreground">Eliminando fondo de la imagen...</span>
                  <Label htmlFor={uploadId} className="mt-3 cursor-pointer text-xs text-muted-foreground underline">
                    Elegir otra imagen
                  </Label>
                </div>
              ) : processingError ? (
                <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center" role="alert">
                  <p className="text-sm text-destructive">{processingError}</p>
                  <div className="mt-4 flex items-center gap-4">
                    {sourceImage && (
                      <button type="button" onClick={() => void processImage(sourceImage)} className="text-xs font-medium text-primary underline">
                        Reintentar
                      </button>
                    )}
                    <Label htmlFor={uploadId} className="cursor-pointer text-xs text-primary underline">
                      Elegir otra imagen
                    </Label>
                  </div>
                </div>
              ) : (
                <div className="relative h-56 p-4">
                  <img src={preview} alt={`Vista previa de ${garment.name}`} className="h-full w-full object-contain" />
                  <Label
                    htmlFor={uploadId}
                    className="absolute inset-x-4 bottom-4 flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-full bg-card/95 px-4 text-xs shadow-soft backdrop-blur transition hover:bg-card peer-focus-visible:ring-2 peer-focus-visible:ring-ring"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Cambiar imagen
                  </Label>
                </div>
              )}
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <ImagePlus className="h-3.5 w-3.5" /> PNG, JPG o WEBP
            </p>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`${uploadId}-name`}>Nombre</Label>
              <Input
                id={`${uploadId}-name`}
                name="name"
                defaultValue={garment.name}
                required
                className="h-11 rounded-xl bg-card"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${uploadId}-brand`}>
                Marca <span className="font-normal text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id={`${uploadId}-brand`}
                name="brand"
                defaultValue={garment.brand || ""}
                placeholder="Ej. Zara"
                autoComplete="off"
                className="h-11 rounded-xl bg-card"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${uploadId}-category`}>Categoría</Label>
              <select id={`${uploadId}-category`} name="category" required defaultValue={garment.category} className={selectClassName}>
                {categories.slice(1).map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${uploadId}-color`}>
                Color <span className="font-normal text-muted-foreground">(opcional)</span>
              </Label>
              <select id={`${uploadId}-color`} name="color" defaultValue={garment.color} className={selectClassName}>
                <option value="">Selecciona un color</option>
                {colors.slice(1).map((color) => (
                  <option key={color} value={color}>{color}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${uploadId}-season`}>
                Temporada <span className="font-normal text-muted-foreground">(opcional)</span>
              </Label>
              <select id={`${uploadId}-season`} name="season" defaultValue={garment.season} className={selectClassName}>
                <option value="">Selecciona una temporada</option>
                {seasons.slice(1).map((season) => (
                  <option key={season} value={season}>{season}</option>
                ))}
              </select>
            </div>
          </div>

          {saveError && <p className="mt-4 text-sm text-destructive" role="alert">{saveError}</p>}

          {confirmDelete && (
            <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-4" role="alert">
              <p className="text-sm font-medium text-foreground">¿Eliminar {garment.name}?</p>
              <p className="mt-1 text-xs text-muted-foreground">Esta acción no se puede deshacer.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  disabled={isDeleting}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-destructive px-4 text-xs font-medium text-destructive-foreground disabled:opacity-50"
                >
                  {isDeleting && <LoaderCircle className="h-4 w-4 animate-spin" />}
                  Sí, eliminar
                </button>
                <button type="button" onClick={() => setConfirmDelete(false)} disabled={isDeleting} className="text-xs font-medium text-foreground underline">
                  Conservar prenda
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              disabled={isSaving || isDeleting || confirmDelete}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium text-destructive transition hover:bg-destructive/10 disabled:opacity-50 sm:justify-start"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar prenda
            </button>
            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <DialogClose asChild>
                <button type="button" className={secondaryButtonClassName}>Cancelar</button>
              </DialogClose>
              <button type="submit" disabled={isProcessing || isSaving || isDeleting} className={primaryButtonClassName}>
                {isSaving && <LoaderCircle className="h-4 w-4 animate-spin" />}
                Guardar cambios
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
