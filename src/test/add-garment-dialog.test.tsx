import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AddGarmentDialog } from "@/components/closet/AddGarmentDialog";

function openDialog() {
  render(<AddGarmentDialog trigger={<button type="button">Agregar prenda</button>} />);
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

  it("shows a preview of the selected garment image", () => {
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:garment-preview"),
      revokeObjectURL: vi.fn(),
    });
    openDialog();

    const file = new File(["garment"], "camisa.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Foto de la prenda"), { target: { files: [file] } });

    expect(screen.getByRole("img", { name: "Vista previa de la prenda" })).toHaveAttribute(
      "src",
      "blob:garment-preview",
    );
    vi.unstubAllGlobals();
  });
});
