import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OutfitEditorDialog } from "@/components/closet/OutfitEditorDialog";
import type { Garment } from "@/lib/demo-data";

const addOutfit = vi.fn().mockResolvedValue(undefined);
const updateOutfit = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/garment-store", () => ({
  useGarments: () => ({ addOutfit, updateOutfit }),
}));

const garments: Garment[] = [
  { id: "g1", name: "Camisa blanca", category: "Superiores", color: "Blanco", season: "Todo el año", image: "camisa.png" },
  { id: "g2", name: "Jeans azules", category: "Inferiores", color: "Azul", season: "Todo el año", image: "jeans.png" },
];

describe("OutfitEditorDialog", () => {
  beforeEach(() => {
    addOutfit.mockClear();
    updateOutfit.mockClear();
  });

  it("creates an outfit from multiple garments", async () => {
    render(<OutfitEditorDialog outfit={null} garments={garments} open onClose={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Look de diario" } });
    fireEvent.change(screen.getByLabelText("Ocasión"), { target: { value: "Casual" } });
    fireEvent.click(screen.getByLabelText(/Camisa blanca/));
    fireEvent.click(screen.getByLabelText(/Jeans azules/));
    fireEvent.click(screen.getByRole("button", { name: "Guardar outfit" }));

    await waitFor(() =>
      expect(addOutfit).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Look de diario", occasion: "Casual", garmentIds: ["g1", "g2"] }),
      ),
    );
  });

  it("loads and saves changes to an existing outfit", async () => {
    const outfit = { id: "o1", name: "Look original", occasion: "Trabajo", garmentIds: ["g1"] };
    render(<OutfitEditorDialog outfit={outfit} garments={garments} open onClose={vi.fn()} />);

    expect(screen.getByLabelText("Nombre")).toHaveValue("Look original");
    expect(screen.getByLabelText(/Camisa blanca/)).toBeChecked();
    fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Look actualizado" } });
    fireEvent.click(screen.getByLabelText(/Jeans azules/));
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() =>
      expect(updateOutfit).toHaveBeenCalledWith({
        id: "o1",
        name: "Look actualizado",
        occasion: "Trabajo",
        garmentIds: ["g1", "g2"],
      }),
    );
  });
});