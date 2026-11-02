export function toIndex(row: number, col: number, cols: number): number {
  return row * cols + col;
}

export function toRowCol(index: number, cols: number): { row: number; col: number } {
  return { row: Math.floor(index / cols), col: index % cols };
}

/** Indices of the up to 8 neighbours (horizontal, vertical, diagonal), clipped at the edges. */
export function neighbours(index: number, rows: number, cols: number): number[] {
  const { row, col } = toRowCol(index, cols);
  const result: number[] = [];
  for (let r = row - 1; r <= row + 1; r++) {
    for (let c = col - 1; c <= col + 1; c++) {
      if ((r !== row || c !== col) && r >= 0 && r < rows && c >= 0 && c < cols) {
        result.push(toIndex(r, c, cols));
      }
    }
  }
  return result;
}
