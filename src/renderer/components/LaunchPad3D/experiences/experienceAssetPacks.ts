import type { Desktop3dExperienceId } from "./types";
import {
  EXPERIENCE_HDRIS,
  EXPERIENCE_MODELS,
  LIBRARY_TEXTURES,
} from "./assetUrls";

/** Desk props shared by every desk-room world */
const SHARED_DESK_ASSETS = [
  EXPERIENCE_MODELS.modernArmChair,
  EXPERIENCE_MODELS.pottedPlant,
  EXPERIENCE_MODELS.binderNotebook,
  EXPERIENCE_MODELS.stationerySupplies,
  EXPERIENCE_MODELS.standingPictureFrame,
  EXPERIENCE_MODELS.roundWoodenTable,
  EXPERIENCE_MODELS.metalOfficeDesk,
] as const;

const PACKS: Record<Desktop3dExperienceId, readonly string[]> = {
  "control-room": [],
  "desert-pyramids": [
    ...SHARED_DESK_ASSETS,
    EXPERIENCE_MODELS.blenderDesertPyramids,
    EXPERIENCE_HDRIS.desert,
  ],
  "office-tower": [
    ...SHARED_DESK_ASSETS,
    EXPERIENCE_MODELS.blenderOffice,
    EXPERIENCE_HDRIS.office,
  ],
  "space-station": [...SHARED_DESK_ASSETS, EXPERIENCE_HDRIS.night],
  "library-hall": [
    ...SHARED_DESK_ASSETS,
    EXPERIENCE_MODELS.sketchfabLibrary,
    EXPERIENCE_MODELS.woodenBookshelfWorn,
    EXPERIENCE_MODELS.bookEncyclopedia,
    EXPERIENCE_HDRIS.oldHall,
    LIBRARY_TEXTURES.woodFloor.map,
    LIBRARY_TEXTURES.woodFloor.normalMap,
    LIBRARY_TEXTURES.woodFloor.armMap,
    LIBRARY_TEXTURES.clayPlaster.map,
    LIBRARY_TEXTURES.clayPlaster.normalMap,
    LIBRARY_TEXTURES.clayPlaster.armMap,
  ],
  "mountain-lodge": [
    ...SHARED_DESK_ASSETS,
    EXPERIENCE_MODELS.rockMoss,
    EXPERIENCE_MODELS.rock01,
    EXPERIENCE_HDRIS.lodge,
  ],
  "victorian-study": [
    ...SHARED_DESK_ASSETS,
    EXPERIENCE_MODELS.blenderVictorianStudy,
    EXPERIENCE_HDRIS.readingRoom,
  ],
};

export function getExperienceAssetPack(
  experienceId: string | null | undefined
): string[] {
  const id = (experienceId || "control-room") as Desktop3dExperienceId;
  const pack = PACKS[id] ?? PACKS["control-room"];
  // Dedupe while preserving order
  return [...new Set(pack)];
}
