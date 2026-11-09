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
import { PrimaryButton } from "@/components/closet/ui";
import { useGarments } from "@/lib/garment-store";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const selectClassName =
  "h-11 w-full rounded-xl border border-input bg-card px-3 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring";

export function AddGarmentDialog({ trigger }: { trigger: ReactNode }) {
  return <GarmentDialog trigger={trigger} />;
}

export function EditGarmentDialog({
  garment,
  open,
  onOpenChange,
}: {
  garment: Garment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return garment ? (
    <GarmentDialog key={garment.id} garment={garment} open={open} onOpenChange={onOpenChange} />
  ) : null;
}

function GarmentDialog({
  trigger,
  garment,
  open: controlledOpen,
  onOpenChange,
}: {
  trigger?: ReactNode;
  garment?: Garment;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [sourceImage, setSourceImage] = useState<File | null>(null);
  const [processedImage, setProcessedImage] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [processingError, setProcessingError] = useState("");
  const [saveError, setSaveError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const requestRef = useRef<{ id: number; controller: AbortController } | null>(null);
  const requestIdRef = useRef(0);
  const uploadId = useId();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const { addGarment, updateGarment, deleteGarment } = useGarments();

  useEffect(() => {
    if (!processedImage) {
      setPreview(null);
      return;
    }

    const url = URL.createObjectURL(processedImage);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [processedImage]);

  useEffect(() => () => requestRef.current?.controller.abort(), []);

  const processImage = async (file: File) => {
    requestRef.current?.controller.abort();
    const id = ++requestIdRef.current;
    const controller = new AbortController();
    requestRef.current = { id, controller };
    setSourceImage(file);
    setProcessedImage(null);
    setProcessingError("");
    setSaveError("");
    setIsProcessing(true);

    try {
      const body = new FormData();
      body.append("file", file);
      const endpoint =
        import.meta.env.VITE_BACKGROUND_REMOVAL_API_URL || "http://localhost:7000/api/remove-background";
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
    if (controlledOpen === undefined) setUncontrolledOpen(nextOpen);
    onOpenChange?.(nextOpen);
    if (!nextOpen) {
      requestRef.current?.controller.abort();
      requestIdRef.current += 1;
      requestRef.current = null;
      setSourceImage(null);
      setProcessedImage(null);
      setIsProcessing(false);
      setProcessingError("");
      setSaveError("");
      formRef.current?.reset();
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if ((!garment && !processedImage) || isProcessing || isSaving) return;

    const formData = new FormData(event.currentTarget);
    const category = String(formData.get("category"));
    const fileName = sourceImage?.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
    const enteredName = String(formData.get("name") || "").trim();
    const name = enteredName || fileName?.replace(/(^|\s)\S/g, (letter) => letter.toLocaleUpperCase("es")) || category;
    setIsSaving(true);
    setSaveError("");
    try {
      const details = {
        id: garment?.id ?? `g-${crypto.randomUUID()}`,
        name,
        category,
        color: String(formData.get("color") || ""),
        season: String(formData.get("season") || ""),
        brand: String(formData.get("brand") || "").trim() || undefined,
      };
      if (garment) await updateGarment(details, processedImage ?? undefined);
      else if (processedImage) await addGarment(details, processedImage);
      handleOpenChange(false);
    } catch {
      setSaveError("No se pudieron guardar los cambios en este dispositivo. Inténtalo de nuevo.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!garment) return;
    setIsSaving(true);
    setSaveError("");
    try {
      await deleteGarment(garment.id);
      setDeleteOpen(false);
      handleOpenChange(false);
    } catch {
      setSaveError("No se pudo eliminar la prenda. Inténtalo de nuevo.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[92vh] max-w-xl gap-0 overflow-y-auto rounded-3xl bg-card p-0 shadow-lift">
        <DialogHeader className="border-b px-6 py-6 text-left sm:px-8">
          <DialogTitle className="font-display text-2xl font-medium">
            {garment ? "Editar prenda" : "Agregar una prenda"}
          </DialogTitle>
          <DialogDescription className="mt-1">
            {garment
              ? "Actualiza los datos de esta prenda o reemplaza su fotografía."
              : "Sube una foto y agrega los detalles para identificarla en tu armario."}
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="px-6 py-6 sm:px-8">
          <div>
            <Label htmlFor={uploadId}>Foto de la prenda</Label>
            <div className="relative mt-2 overflow-hidden rounded-2xl bg-[#d6c6ad]">
              <input
                id={uploadId}
                name="image"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="peer sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    if (!garment && nameInputRef.current && !nameInputRef.current.value) {
                      nameInputRef.current.value = file.name
                        .replace(/\.[^.]+$/, "")
                        .replace(/[-_]+/g, " ")
                        .replace(/(^|\s)\S/g, (letter) => letter.toLocaleUpperCase("es"));
                    }
                    void processImage(file);
                  }
                }}
              />
              {isProcessing ? (
                <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center" role="status">
                  <LoaderCircle className="h-6 w-6 animate-spin text-primary" />
                  <span className="mt-3 text-sm font-medium text-foreground">
                    Eliminando fondo de la imagen...
                  </span>
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
              ) : preview || garment?.image ? (
                <div className="relative h-56 p-4">
                  <img
                    src={preview ?? garment?.image}
                    alt="Vista previa de la prenda"
                    className="h-full w-full object-contain"
                  />
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
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="garment-name">Nombre</Label>
              <Input
                ref={nameInputRef}
                id="garment-name"
                name="name"
                defaultValue={garment?.name ?? ""}
                placeholder="Ej. Camisa blanca"
                required
                className="h-11 rounded-xl bg-card"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="garment-brand">
                Marca <span className="font-normal text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="garment-brand"
                name="brand"
                defaultValue={garment?.brand ?? ""}
                placeholder="Ej. Zara"
                autoComplete="off"
                className="h-11 rounded-xl bg-card"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="garment-category">Categoría</Label>
              <select
                id="garment-category"
                name="category"
                required
                defaultValue={garment?.category ?? ""}
                className={selectClassName}
              >
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
              <select id="garment-color" name="color" defaultValue={garment?.color ?? ""} className={selectClassName}>
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
              <select id="garment-season" name="season" defaultValue={garment?.season ?? ""} className={selectClassName}>
                <option value="">Selecciona una temporada</option>
                {seasons.slice(1).map((season) => (
                  <option key={season} value={season}>
                    {season}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {saveError && <p className="mt-4 text-sm text-destructive" role="alert">{saveError}</p>}

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            {garment && (
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                disabled={isSaving}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium text-destructive transition hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar prenda
              </button>
            )}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:ml-auto">
              <DialogClose asChild>
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center justify-center rounded-full border bg-card px-5 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Cancelar
                </button>
              </DialogClose>
              <PrimaryButton
                type="submit"
                disabled={(!garment && !processedImage) || isProcessing || isSaving}
              >
                {isSaving && <LoaderCircle className="h-4 w-4 animate-spin" />}
                {garment ? "Guardar cambios" : "Guardar prenda"}
              </PrimaryButton>
            </div>
          </div>
        </form>
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar {garment?.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta prenda dejará de aparecer en tu armario. No se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={(event) => {
                  event.preventDefault();
                  void handleDelete();
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
