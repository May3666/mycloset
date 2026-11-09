import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EditGarmentDialog } from "@/components/closet/EditGarmentDialog";
import { garments } from "@/lib/demo-data";

const updateGarment = vi.fn().mockResolvedValue(undefined);
const deleteGarment = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/garment-store", () => ({
  useGarments: () => ({ updateGarment, deleteGarment }),
}));

function openDialog() {
  const garment = { ...garments[0]!, brand: "Marca original" };
  render(
    <EditGarmentDialog garment={garment} trigger={<button type="button">Editar Camisa blanca</button>} />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Editar Camisa blanca" }));
}

describe("Edit garment dialog", () => {
  beforeEach(() => {
    updateGarment.mockClear();
    deleteGarment.mockClear();
  });

  it("opens with the garment data and saves edited details", async () => {
    openDialog();

    expect(screen.getByLabelText("Nombre")).toHaveValue("Camisa blanca");
    expect(screen.getByLabelText("Marca (opcional)")).toHaveValue("Marca original");
    expect(screen.getByLabelText("Categoría")).toHaveValue("Superiores");
    fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Camisa nueva" } });
    fireEvent.change(screen.getByLabelText("Marca (opcional)"), { target: { value: "Nueva marca" } });
    fireEvent.change(screen.getByLabelText("Categoría"), { target: { value: "Abrigos" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() =>
      expect(updateGarment).toHaveBeenCalledWith(
        "g1",
        expect.objectContaining({ name: "Camisa nueva", brand: "Nueva marca", category: "Abrigos" }),
        undefined,
      ),
    );
  });

  it("only deletes after the user confirms", async () => {
    openDialog();

    fireEvent.click(screen.getByRole("button", { name: "Eliminar prenda" }));
    expect(deleteGarment).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Sí, eliminar" }));

    await waitFor(() => expect(deleteGarment).toHaveBeenCalledWith("g1"));
  });
});
