/**
 * Translates a drop position in the *visible* list of a column (which may be
 * filtered or sorted) into an index in the column's full, manually ordered
 * list. The returned index assumes the dragged card was already removed.
 */
export function resolveDropIndex(
  fullIds: string[],
  visibleIds: string[],
  visibleIndex: number,
  draggedId: string,
): number {
  const full = fullIds.filter((id) => id !== draggedId)
  const visible = visibleIds.filter((id) => id !== draggedId)
  if (visible.length === 0) return full.length

  // Insert right before the card that will end up below the dropped one...
  if (visibleIndex < visible.length) {
    const anchor = full.indexOf(visible[visibleIndex])
    return anchor === -1 ? full.length : anchor
  }
  // ...or right after the last visible card when dropped at the end.
  const last = full.indexOf(visible[visible.length - 1])
  return last === -1 ? full.length : last + 1
}
