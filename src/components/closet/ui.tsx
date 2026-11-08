import { ArrowUpRight, MoreHorizontal, Search, Shirt, Sparkles, SearchX, Plus, type LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { getGarment, type Garment, type Outfit } from "@/lib/demo-data";

export function PrimaryButton({ children, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-soft transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function OptionsButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      aria-label={`Opciones de ${label}`}
      className="rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
    >
      <MoreHorizontal className="h-4 w-4" />
    </button>
  );
}

export function DemoBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-sage-soft px-3 py-1 text-xs font-medium text-primary">
      Datos demostrativos
    </span>
  );
}

export function GarmentCard({ garment }: { garment: Garment }) {
  return (
    <article className="group overflow-hidden rounded-2xl bg-card shadow-soft transition hover:shadow-lift">
      <div className="aspect-[4/5] overflow-hidden bg-secondary">
        <img
          src={garment.image}
          alt={garment.name}
          loading="lazy"
          width={768}
          height={960}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex items-start justify-between gap-2 p-4">
        <div>
          <h3 className="font-sans text-sm font-medium text-foreground">{garment.name}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {garment.category} · {garment.color}
          </p>
        </div>
        <OptionsButton label={garment.name} />
      </div>
    </article>
  );
}

export function OutfitCard({ outfit, onClick }: { outfit: Outfit; onClick: () => void }) {
  const items = outfit.garmentIds.map(getGarment);
  const cells = items.slice(0, 4);
  return (
    <article className="overflow-hidden rounded-2xl bg-card p-3 shadow-soft transition hover:shadow-lift">
      <button
        type="button"
        onClick={onClick}
        aria-label={`Ver outfit ${outfit.name}`}
        className="group block w-full rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="grid aspect-square grid-cols-2 gap-2">
          {cells.map((g, i) => (
            <div
              key={g.id}
              className={`overflow-hidden rounded-xl bg-secondary ${cells.length === 3 && i === 0 ? "row-span-2" : ""}`}
            >
              <img
                src={g.image}
                alt={g.name}
                loading="lazy"
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              />
            </div>
          ))}
        </div>
        <div className="flex items-start justify-between gap-2 px-1 pb-1 pt-4">
          <div>
            <h3 className="text-lg text-foreground">{outfit.name}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {outfit.occasion} · {items.length} prendas
            </p>
          </div>
          <span className="rounded-full p-2 text-muted-foreground transition group-hover:bg-sage-soft group-hover:text-primary">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </button>
    </article>
  );
}

export function SearchBar({ placeholder }: { placeholder: string }) {
  return (
    <label className="flex min-h-11 flex-1 items-center gap-3 rounded-full border bg-card px-4 shadow-soft focus-within:ring-2 focus-within:ring-ring">
      <Search className="h-4 w-4 text-muted-foreground" />
      <input
        type="search"
        placeholder={placeholder}
        className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </label>
  );
}

export function FilterChips({ label, options }: { label: string; options: string[] }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      <span className="shrink-0 text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      {options.map((o, i) => (
        <button
          key={o}
          type="button"
          className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs transition ${
            i === 0 ? "border-primary bg-primary text-primary-foreground" : "bg-card text-foreground hover:border-sage"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, title, message, action }: { icon: LucideIcon; title: string; message: string; action: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed bg-card px-6 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-sage-soft text-primary">
        <Icon className="h-6 w-6" strokeWidth={1.5} />
      </span>
      <h3 className="mt-5 text-xl">{title}</h3>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">{message}</p>
      <div className="mt-6">{action}</div>
    </div>
  );
}

export const EmptyGarments = ({ action }: { action?: ReactNode }) => (
  <EmptyState icon={Shirt} title="Tu armario está vacío" message="Agrega tu primera prenda y empieza a construir tu armario digital."
    action={action ?? <PrimaryButton><Plus className="h-4 w-4" />Agregar prenda</PrimaryButton>} />
);
export const EmptyOutfits = () => (
  <EmptyState icon={Sparkles} title="Aún no hay outfits" message="Combina tus prendas favoritas y guarda tu primer look."
    action={<PrimaryButton><Plus className="h-4 w-4" />Crear outfit</PrimaryButton>} />
);
export const EmptySearch = () => (
  <EmptyState icon={SearchX} title="Sin resultados" message="No encontramos prendas con esos filtros. Prueba con otra búsqueda."
    action={<PrimaryButton>Limpiar filtros</PrimaryButton>} />
);
