import type { FC } from "react";

import type { Desktop3dExperienceId } from "../experiences/types";
import DefaultWoodDesk from "./DefaultWoodDesk";
import DesertStoneDesk from "./DesertStoneDesk";
import LibraryWoodDesk from "./LibraryWoodDesk";
import MountainLodgeDesk from "./MountainLodgeDesk";
import OfficeModernDesk from "./OfficeModernDesk";
import SpaceStationDesk from "./SpaceStationDesk";
import type { DeskTableProps } from "./types";

export { getDeskLayout, supportHeight } from "./deskLayout";
export type { DeskLayout } from "./deskLayout";
export type { DeskTableProps } from "./types";

const DESK_TABLES: Partial<
  Record<Desktop3dExperienceId, FC<DeskTableProps>>
> = {
  "desert-pyramids": DesertStoneDesk,
  "office-tower": OfficeModernDesk,
  "space-station": SpaceStationDesk,
  "library-hall": LibraryWoodDesk,
  "mountain-lodge": MountainLodgeDesk,
};

export function getDeskTable(
  experienceId: string | null | undefined
): FC<DeskTableProps> {
  if (experienceId && experienceId in DESK_TABLES) {
    return DESK_TABLES[experienceId as Desktop3dExperienceId] || DefaultWoodDesk;
  }
  return DefaultWoodDesk;
}
