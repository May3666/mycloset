import camisa from "@/assets/camisa-blanca.jpg";
import jeans from "@/assets/jeans-azules.jpg";
import blazer from "@/assets/blazer-beige.jpg";
import vestido from "@/assets/vestido-negro.jpg";
import tenis from "@/assets/tenis-blancos.jpg";
import sueter from "@/assets/sueter-salvia.jpg";

// Datos demostrativos — se reemplazarán por datos reales en fases posteriores.
export type Garment = {
  id: string;
  name: string;
  category: string;
  color: string;
  season: string;
  image: string;
  brand?: string;
};

export type Outfit = {
  id: string;
  name: string;
  occasion: string;
  garmentIds: string[];
};

export const garments: Garment[] = [
  { id: "g1", name: "Camisa blanca", category: "Superiores", color: "Blanco", season: "Todo el año", image: camisa },
  { id: "g2", name: "Jeans azules", category: "Inferiores", color: "Azul", season: "Todo el año", image: jeans },
  { id: "g3", name: "Blazer beige", category: "Abrigos", color: "Beige", season: "Otoño", image: blazer },
  { id: "g4", name: "Vestido negro", category: "Vestidos", color: "Negro", season: "Primavera", image: vestido },
  { id: "g5", name: "Tenis blancos", category: "Calzado", color: "Blanco", season: "Todo el año", image: tenis },
  { id: "g6", name: "Suéter verde salvia", category: "Superiores", color: "Verde", season: "Invierno", image: sueter },
];

export const outfits: Outfit[] = [
  { id: "o1", name: "Casual de fin de semana", occasion: "Casual", garmentIds: ["g6", "g2", "g5"] },
  { id: "o2", name: "Look de oficina", occasion: "Trabajo", garmentIds: ["g3", "g1", "g2", "g5"] },
  { id: "o3", name: "Outfit para salir", occasion: "Noche", garmentIds: ["g4", "g3", "g5"] },
];

export const getGarment = (id: string, collection: Garment[] = garments) =>
  collection.find((garment) => garment.id === id)!;

export const getOutfitGarments = (outfit: Outfit, collection: Garment[] = garments) =>
  outfit.garmentIds.flatMap((id) => {
    const garment = collection.find((item) => item.id === id);
    return garment ? [garment] : [];
  });

export const categories = ["Todas", "Superiores", "Inferiores", "Abrigos", "Vestidos", "Calzado"];
export const colors = ["Todos", "Blanco", "Azul", "Beige", "Negro", "Verde"];
export const seasons = ["Todas", "Primavera", "Otoño", "Invierno", "Todo el año"];
