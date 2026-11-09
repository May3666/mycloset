import { describe, expect, it } from "vitest";

import { filterGarments, garments } from "@/lib/demo-data";

describe("wardrobe filters", () => {
  it("searches garment names without case or accent sensitivity", () => {
    const results = filterGarments(garments, {
      query: "SUETER",
      category: null,
      color: null,
      season: null,
    });

    expect(results.map((garment) => garment.id)).toEqual(["g6"]);
  });

  it("combines the name, category, color and season filters", () => {
    const results = filterGarments(garments, {
      query: "azules",
      category: "Inferiores",
      color: "Azul",
      season: "Todo el año",
    });

    expect(results.map((garment) => garment.id)).toEqual(["g2"]);
  });
});