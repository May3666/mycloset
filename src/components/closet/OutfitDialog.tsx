import { Download, LoaderCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

import { PrimaryButton } from "@/components/closet/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getGarment, type Garment, type Outfit } from "@/lib/demo-data";

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 1500;

type Rectangle = { x: number; y: number; width: number; height: number };

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`No se pudo cargar la imagen: ${src}`));
    image.src = src;
  });
}

function themeColor(token: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(token).trim();
}

function drawGarment(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  rectangle: Rectangle,
) {
  const { x, y, width, height } = rectangle;
  const padding = 14;
  const availableWidth = width - padding * 2;
  const availableHeight = height - padding * 2;
  const scale = Math.min(availableWidth / image.width, availableHeight / image.height);
  const imageWidth = image.width * scale;
  const imageHeight = image.height * scale;

  context.save();
  context.beginPath();
  context.roundRect(x, y, width, height, 44);
  context.clip();
  context.drawImage(
    image,
    x + (width - imageWidth) / 2,
    y + (height - imageHeight) / 2,
    imageWidth,
    imageHeight,
  );
  context.restore();
}

async function drawOutfit(canvas: HTMLCanvasElement, outfit: Outfit, garments: Garment[]) {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas no disponible");

  const items = outfit.garmentIds.flatMap((id) => {
    const garment = getGarment(id, garments);
    return garment ? [garment] : [];
  });
  const images = new Map<string, HTMLImageElement>();
  await Promise.all(
    items.map(async (item) => {
      images.set(item.id, await loadImage(item.image));
    }),
  );
  await document.fonts.ready;

  const background = themeColor("--secondary");
  const foreground = themeColor("--foreground");
  const muted = themeColor("--muted-foreground");
  const sageSoft = themeColor("--sage-soft");

  context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  context.fillStyle = background;
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  context.fillStyle = muted;
  context.font = '500 25px "DM Sans", sans-serif';
  context.letterSpacing = "5px";
  context.fillText("MYCLOSET", 80, 88);
  context.letterSpacing = "0px";

  context.fillStyle = foreground;
  context.font = '500 56px "Playfair Display", serif';
  context.fillText(outfit.name, 80, 166, 1040);
  context.fillStyle = muted;
  context.font = '400 27px "DM Sans", sans-serif';
  context.fillText(`${outfit.occasion} · ${items.length} prendas`, 80, 216);

  context.fillStyle = sageSoft;
  context.beginPath();
  context.arc(600, 294, 43, 0, Math.PI * 2);
  context.fill();

  const imageFor = (item?: Garment) => (item ? images.get(item.id) : undefined);
  const outerwear = items.find((item) => item.category === "Abrigos");
  const top = items.find((item) => item.category === "Superiores");
  const dress = items.find((item) => item.category === "Vestidos");
  const bottom = items.find((item) => item.category === "Inferiores");
  const shoes = items.find((item) => item.category === "Calzado");

  const outerwearImage = imageFor(outerwear);
  if (outerwearImage) {
    drawGarment(context, outerwearImage, { x: 90, y: 390, width: 460, height: 400 });
  }

  const topImage = imageFor(top);
  if (topImage) {
    drawGarment(
      context,
      topImage,
      outerwear
        ? { x: 650, y: 400, width: 460, height: 360 }
        : { x: 270, y: 360, width: 660, height: 420 },
    );
  }

  const dressImage = imageFor(dress);
  if (dressImage) {
    drawGarment(
      context,
      dressImage,
      outerwear
        ? { x: 620, y: 350, width: 490, height: 790 }
        : { x: 260, y: 350, width: 680, height: 790 },
    );
  }

  const bottomImage = imageFor(bottom);
  if (bottomImage) {
    drawGarment(
      context,
      bottomImage,
      outerwear
        ? { x: 320, y: 800, width: 560, height: 370 }
        : { x: 320, y: 770, width: 560, height: 400 },
    );
  }

  const shoesImage = imageFor(shoes);
  if (shoesImage) {
    drawGarment(context, shoesImage, { x: 290, y: 1190, width: 620, height: 210 });
  }

  context.fillStyle = muted;
  context.font = '400 23px "DM Sans", sans-serif';
  context.textAlign = "center";
  context.fillText("Tu estilo, a tu manera.", 600, 1460);
  context.textAlign = "start";
}

function downloadFileName(outfitName: string) {
  const slug = outfitName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `outfit-${slug}.png`;
}

function OutfitCanvas({
  outfit,
  garments,
  canvasRef,
  isReady,
  hasError,
  onReady,
  onError,
}: {
  outfit: Outfit;
  garments: Garment[];
  canvasRef: RefObject<HTMLCanvasElement | null>;
  isReady: boolean;
  hasError: boolean;
  onReady: () => void;
  onError: () => void;
}) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;

    drawOutfit(canvas, outfit, garments)
      .then(() => {
        if (!cancelled) onReady();
      })
      .catch(() => {
        if (!cancelled) onError();
      });

    return () => {
      cancelled = true;
    };
  }, [canvasRef, outfit, garments, onReady, onError]);

  return (
    <>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        role="img"
        aria-label={`Silueta del outfit ${outfit.name}`}
        className={`block h-auto w-full rounded-2xl shadow-soft transition-opacity ${isReady ? "opacity-100" : "opacity-0"}`}
      />
      {!isReady && !hasError && (
        <div className="absolute inset-0 flex aspect-[4/5] items-center justify-center rounded-2xl bg-secondary text-sm text-muted-foreground">
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          Preparando tu outfit...
        </div>
      )}
    </>
  );
}

export function OutfitDialog({
  outfit,
  garments,
  onClose,
}: {
  outfit: Outfit | null;
  garments: Garment[];
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setIsReady(false);
    setError("");
  }, [outfit]);

  const handleReady = useCallback(() => setIsReady(true), []);
  const handleRenderError = useCallback(
    () => setError("No pudimos preparar la vista del outfit. Inténtalo de nuevo."),
    [],
  );

  const handleDownload = async () => {
    if (!outfit || !canvasRef.current) return;
    setIsDownloading(true);
    setError("");

    try {
      await drawOutfit(canvasRef.current, outfit, garments);
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvasRef.current?.toBlob((result) => {
          if (result) resolve(result);
          else reject(new Error("No se pudo generar la imagen"));
        }, "image/png");
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = downloadFileName(outfit.name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError("No pudimos descargar la imagen. Inténtalo de nuevo.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open={Boolean(outfit)} onOpenChange={(open) => !open && onClose()}>
      {outfit && (
        <DialogContent className="max-h-[92vh] max-w-5xl gap-0 overflow-y-auto rounded-3xl bg-card p-0 shadow-lift">
          <DialogHeader className="border-b px-6 py-5 text-left sm:px-8">
            <DialogTitle className="pr-8 font-display text-2xl font-medium">{outfit.name}</DialogTitle>
            <DialogDescription>
              Una vista de tus prendas acomodadas como silueta para imaginar el conjunto completo.
            </DialogDescription>
          </DialogHeader>

          <div className="grid lg:grid-cols-[minmax(0,1.3fr)_minmax(270px,0.7fr)]">
            <div className="bg-secondary/60 p-4 sm:p-6">
              <div className="relative mx-auto w-full max-w-[400px] lg:max-w-[380px]">
                <OutfitCanvas
                  outfit={outfit}
                  garments={garments}
                  canvasRef={canvasRef}
                  isReady={isReady}
                  hasError={Boolean(error)}
                  onReady={handleReady}
                  onError={handleRenderError}
                />
              </div>
            </div>

            <div className="flex flex-col p-6 sm:p-8">
              <h3 className="text-xl">Prendas del outfit</h3>
              <ul className="mt-5 space-y-4">
                {outfit.garmentIds.flatMap((id) => {
                  const garment = getGarment(id, garments);
                  return garment ? [garment] : [];
                }).map((garment) => (
                  <li key={garment.id} className="flex items-center gap-3">
                    <img
                      src={garment.image}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-xl bg-secondary object-contain"
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">{garment.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {garment.category}{garment.color ? ` · ${garment.color}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-8 lg:mt-auto lg:pt-8">
                {error && <p className="mb-3 text-sm text-destructive">{error}</p>}
                <PrimaryButton
                  onClick={handleDownload}
                  disabled={!isReady || isDownloading}
                  className="w-full"
                >
                  {isDownloading ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {isDownloading ? "Generando imagen..." : "Descargar imagen"}
                </PrimaryButton>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Se descargará como imagen PNG.
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
