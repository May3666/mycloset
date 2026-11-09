import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AddGarmentDialog, EditGarmentDialog } from "@/components/closet/AddGarmentDialog";
import { garments } from "@/lib/demo-data";
import { GarmentStoreProvider } from "@/lib/garment-store";

function openDialog() {
  render(
    <GarmentStoreProvider>
      <AddGarmentDialog trigger={<button type="button">Agregar prenda</button>} />
    </GarmentStoreProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Agregar prenda" }));
}

describe("Add garment dialog", () => {
  it("opens with category required and brand, color and season optional", () => {
    openDialog();

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("Foto de la prenda")).toHaveAttribute("type", "file");
    expect(screen.getByLabelText("Marca (opcional)")).not.toBeRequired();
    expect(screen.getByLabelText("Categoría")).toBeRequired();
    expect(screen.getByLabelText("Color (opcional)")).not.toBeRequired();
    expect(screen.getByLabelText("Temporada (opcional)")).not.toBeRequired();
  });

  it("opens a garment in edit mode with its current fields", () => {
    const garment = garments[0];
    render(
      <GarmentStoreProvider>
        <EditGarmentDialog garment={garment} open onOpenChange={vi.fn()} />
      </GarmentStoreProvider>,
    );

    expect(screen.getByRole("heading", { name: "Editar prenda" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre")).toHaveValue(garment.name);
    expect(screen.getByLabelText("Categoría")).toHaveValue(garment.category);
    expect(screen.getByRole("button", { name: "Eliminar prenda" })).toBeInTheDocument();
  });

  it("asks for confirmation before deleting a garment", () => {
    render(
      <GarmentStoreProvider>
        <EditGarmentDialog
          garment={garments[0]}
          open
          onOpenChange={vi.fn()}
        />
      </GarmentStoreProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Eliminar prenda" }));

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: `¿Eliminar ${garments[0].name}?` })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("shows a preview of the selected garment image", async () => {
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:garment-preview"),
      revokeObjectURL: vi.fn(),
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        blob: async () => new Blob(["transparent png"], { type: "image/png" }),
      }),
    );
    openDialog();

    const file = new File(["garment"], "camisa.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Foto de la prenda"), { target: { files: [file] } });

    await waitFor(() =>
      expect(screen.getByRole("img", { name: "Vista previa de la prenda" })).toHaveAttribute(
        "src",
        "blob:garment-preview",
      ),
    );
    vi.unstubAllGlobals();
  });

  it("keeps saving disabled while background removal is running", async () => {
    let resolveResponse!: (response: {
      ok: boolean;
      blob: () => Promise<Blob>;
    }) => void;
    const response = new Promise<{ ok: boolean; blob: () => Promise<Blob> }>((resolve) => {
      resolveResponse = resolve;
    });
    vi.stubGlobal("fetch", vi.fn(() => response));
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:processed-preview"),
      revokeObjectURL: vi.fn(),
    });
    openDialog();

    fireEvent.change(screen.getByLabelText("Foto de la prenda"), {
      target: { files: [new File(["garment"], "camisa.jpg", { type: "image/jpeg" })] },
    });

    expect(await screen.findByRole("status")).toHaveTextContent("Eliminando fondo de la imagen");
    expect(screen.getByRole("button", { name: "Guardar prenda" })).toBeDisabled();

    await act(async () => {
      resolveResponse({
        ok: true,
        blob: async () => new Blob(["transparent png"], { type: "image/png" }),
      });
    });
    expect(await screen.findByRole("img", { name: "Vista previa de la prenda" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar prenda" })).toBeEnabled();
    vi.unstubAllGlobals();
  });
});
