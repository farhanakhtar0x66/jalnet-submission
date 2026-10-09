import openFreeMapDark from "./openfreemap-dark.json";
import { palettes, type ThemeMode } from "./tokens";

const colors = palettes.dark;

// LOCAL/DEMO presentation only. Keep the upstream sources, layout, geometry,
// glyphs, sprites and attribution paths; improve labels seen in native review.
// The original descriptor and all upstream notices are retained separately.
const readableDarkStyle = {
  ...openFreeMapDark,
  sources: {
    ...openFreeMapDark.sources,
    openmaptiles: {
      ...openFreeMapDark.sources.openmaptiles,
      attribution:
        '<a href="https://openfreemap.org/">OpenFreeMap</a> · <a href="https://openmaptiles.org/">© OpenMapTiles</a> · <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · <a href="https://github.com/openmaptiles/dark-matter-gl-style/blob/master/LICENSE.md">Dark Matter: MapTiler, CartoDB, Stamen & Paul Norman</a> · JalNet color adaptation',
    },
  },
  layers: openFreeMapDark.layers.map((layer) => {
    if (layer.type === "background")
      return {
        ...layer,
        paint: { ...layer.paint, "background-color": colors.background },
      };
    if (
      layer.type !== "symbol" ||
      !layer.layout ||
      !("text-field" in layer.layout)
    )
      return layer;
    const paint = layer.paint as Record<string, unknown>;
    return {
      ...layer,
      paint: {
        ...paint,
        "text-color":
          layer.id === "highway_name_motorway" ||
          layer.id === "place_city" ||
          layer.id === "place_city_large"
            ? colors.text
            : colors.muted,
        "text-halo-color": colors.background,
        "text-halo-width":
          typeof paint["text-halo-width"] === "number"
            ? Math.max(paint["text-halo-width"], 1.2)
            : 1.2,
        "text-halo-blur": 0.5,
      },
    };
  }),
};

// Stable module values avoid constructing a new descriptor on UI rerenders.
// JSON style strings are accepted by the existing native MapLibre component.
// AWS uses its existing separately guarded Amazon Location URL, never this map.
export const localMapStyles: Readonly<Record<ThemeMode, string>> = {
  light: "https://tiles.openfreemap.org/styles/positron",
  dark: JSON.stringify(readableDarkStyle),
};
