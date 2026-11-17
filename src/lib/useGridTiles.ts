import { useCallback, useState } from "react";
import type { LayoutChangeEvent } from "react-native";

/**
 * Tile size for a wrapping grid, from the grid's measured width. On RN 0.88 a `%` width with
 * `aspectRatio` inside a wrapping row collapses to almost no height, so tiles get explicit sizes.
 * `ratio` is width / height (4 / 3 for landscape tiles, 3 / 4 for portrait, 1 for square).
 */
export function useGridTiles(columns: number, gap: number, ratio: number) {
  const [width, setWidth] = useState(0);
  const onLayout = useCallback((e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width), []);
  const tileWidth = width > 0 ? Math.floor((width - gap * (columns - 1)) / columns) : 0;
  return { onLayout, ready: tileWidth > 0, tile: { width: tileWidth, height: Math.round(tileWidth / ratio) } };
}
