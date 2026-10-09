import { create } from "zustand";
export const demoCenter = { lat: 28.6139, lon: 77.209 };
export type Layer = "LIVE" | "FLOOD" | "LEAKS" | "DRAINS" | "ROUTE_RISK";
interface UI {
  initialized: boolean;
  layer: Layer;
  pin: { lat: number; lon: number };
  accuracyM: number | null;
  selected: string | null;
  setLayer: (layer: Layer) => void;
  setPin: (pin: { lat: number; lon: number }, accuracy?: number | null) => void;
  select: (id: string | null) => void;
}
export const useUI = create<UI>((set) => ({
  initialized: false,
  layer: "LIVE",
  pin: demoCenter,
  accuracyM: null,
  selected: null,
  setLayer: (layer) => set({ layer }),
  setPin: (pin, accuracy = null) =>
    set({ pin, accuracyM: accuracy, initialized: true }),
  select: (selected) => set({ selected }),
}));
