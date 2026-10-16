/** Max physical monitors on the circular desk */
export const DESK_SCREEN_MAX = 6;

export function getDeskSlotCount(windowCount: number): number {
  return Math.min(Math.max(0, windowCount), DESK_SCREEN_MAX);
}

/**
 * Map open windows onto desk screen slots.
 *
 * - N ≤ 6: 1:1 window index → slot index.
 * - N > 6: sliding consecutive bank; `focusedIndex` sits on `focusSlot`,
 *   then focused+1, focused+2, … clockwise (order preserved, push/pop).
 */
export function assignWindowIndicesToDeskSlots(
  count: number,
  focusedIndex: number,
  focusSlot: number
): (number | null)[] {
  const slotCount = getDeskSlotCount(count);
  if (slotCount === 0) return [];

  if (count <= DESK_SCREEN_MAX) {
    return Array.from({ length: slotCount }, (_, i) => (i < count ? i : null));
  }

  const focus =
    focusedIndex >= 0 && focusedIndex < count ? focusedIndex : 0;
  const face = ((focusSlot % slotCount) + slotCount) % slotCount;
  const slots: (number | null)[] = new Array(slotCount).fill(null);
  for (let k = 0; k < slotCount; k++) {
    slots[(face + k) % slotCount] = (focus + k) % count;
  }
  return slots;
}

/** Slot index for a window (−1 if off-desk). */
export function deskSlotIndexForWindow(
  index: number,
  focusedIndex: number,
  count: number,
  focusSlot: number
): number {
  if (index < 0 || index >= count) return -1;
  const slots = assignWindowIndicesToDeskSlots(
    count,
    focusedIndex,
    focusSlot
  );
  return slots.indexOf(index);
}

/** Window ids → slot map (null = empty slot). */
export function assignWindowsToDeskSlots(
  windowIds: string[],
  focusedId: string | null | undefined,
  focusSlot: number
): (string | null)[] {
  const count = windowIds.length;
  const focusedIndex = focusedId
    ? Math.max(0, windowIds.indexOf(focusedId))
    : 0;
  const indices = assignWindowIndicesToDeskSlots(
    count,
    focusedIndex,
    focusSlot
  );
  return indices.map((i) => (i == null ? null : windowIds[i] ?? null));
}

/**
 * After drag/wheel/key yaw, advance focus through the full list and move the
 * focus slot by the same step count so the camera stays on the window you
 * turned toward (no reverse settle back to slot 0).
 */
export function resolveDeskOrbitSnap(
  focusedIndex: number,
  focusSlot: number,
  angleOffset: number,
  count: number
): { focusedIndex: number; focusSlot: number } {
  const slotCount = getDeskSlotCount(count);
  if (slotCount <= 1 || count <= 0) {
    return {
      focusedIndex: Math.max(0, focusedIndex),
      focusSlot: Math.max(0, focusSlot),
    };
  }

  const angleStep = (Math.PI * 2) / slotCount;
  const steps = Math.round(angleOffset / angleStep);
  const nextFocus = ((focusedIndex + steps) % count + count) % count;

  if (count <= DESK_SCREEN_MAX) {
    return { focusedIndex: nextFocus, focusSlot: nextFocus };
  }

  const nextSlot = ((focusSlot + steps) % slotCount + slotCount) % slotCount;
  return { focusedIndex: nextFocus, focusSlot: nextSlot };
}

/** @deprecated use resolveDeskOrbitSnap */
export function resolveDeskFocusAfterOffset(
  focusedIndex: number,
  angleOffset: number,
  count: number
): number {
  return resolveDeskOrbitSnap(focusedIndex, 0, angleOffset, count)
    .focusedIndex;
}
