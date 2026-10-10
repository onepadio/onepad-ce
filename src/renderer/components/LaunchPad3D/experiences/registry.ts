import ControlRoomVista from "./ControlRoomVista";
import DesertPyramidsVista from "./DesertPyramidsVista";
import OfficeTowerVista from "./OfficeTowerVista";
import SpaceStationVista from "./SpaceStationVista";
import LibraryHallVista from "./LibraryHallVista";
import MountainLodgeVista from "./MountainLodgeVista";
import type {
  Desktop3dExperienceId,
  ExperienceDefinition,
} from "./types";

export const DEFAULT_EXPERIENCE_ID: Desktop3dExperienceId = "control-room";

export const EXPERIENCES: Record<Desktop3dExperienceId, ExperienceDefinition> =
  {
    "control-room": {
      id: "control-room",
      label: "Control Room",
      description: "Classic circular arena with wall screens and space dome",
      available: true,
      clearColor: 0x2a3a52,
      cssClass: "desktop-3d-exp-control-room",
      Vista: ControlRoomVista,
      usesDeskRoom: false,
      motion: {
        idleYawAmp: 0.012,
        idlePitchAmp: 0.006,
        idlePeriodSec: 8,
      },
    },
    "desert-pyramids": {
      id: "desert-pyramids",
      label: "Pyramids Region",
      description: "Warm desert sun and pyramids on the horizon",
      available: true,
      clearColor: 0xc4a574,
      cssClass: "desktop-3d-exp-desert-pyramids",
      Vista: DesertPyramidsVista,
      usesDeskRoom: true,
      motion: {
        idleYawAmp: 0.014,
        idlePitchAmp: 0.008,
        idlePeriodSec: 10,
      },
    },
    "office-tower": {
      id: "office-tower",
      label: "Office Building",
      description: "City towers and cool daylight through the glass",
      available: true,
      clearColor: 0x6a8498,
      cssClass: "desktop-3d-exp-office-tower",
      Vista: OfficeTowerVista,
      usesDeskRoom: true,
      motion: {
        idleYawAmp: 0.01,
        idlePitchAmp: 0.005,
        idlePeriodSec: 9,
      },
    },
    "space-station": {
      id: "space-station",
      label: "Space Station",
      description: "Orbital hull and drifting stars",
      available: true,
      clearColor: 0x0a1020,
      cssClass: "desktop-3d-exp-space-station",
      Vista: SpaceStationVista,
      usesDeskRoom: true,
      motion: {
        idleYawAmp: 0.016,
        idlePitchAmp: 0.01,
        idlePeriodSec: 12,
      },
    },
    "library-hall": {
      id: "library-hall",
      label: "Library Hall",
      description: "Warm shelves and quiet lamplight",
      available: true,
      clearColor: 0x3d3228,
      cssClass: "desktop-3d-exp-library-hall",
      Vista: LibraryHallVista,
      usesDeskRoom: true,
      motion: {
        idleYawAmp: 0.008,
        idlePitchAmp: 0.004,
        idlePeriodSec: 11,
      },
    },
    "mountain-lodge": {
      id: "mountain-lodge",
      label: "Mountain Lodge",
      description: "Peaks and timber calm outside the window",
      available: true,
      clearColor: 0x4a6a48,
      cssClass: "desktop-3d-exp-mountain-lodge",
      Vista: MountainLodgeVista,
      usesDeskRoom: true,
      motion: {
        idleYawAmp: 0.011,
        idlePitchAmp: 0.007,
        idlePeriodSec: 10,
      },
    },
  };

export function getExperience(
  id: string | null | undefined
): ExperienceDefinition {
  if (id && id in EXPERIENCES) {
    const exp = EXPERIENCES[id as Desktop3dExperienceId];
    if (exp.available) return exp;
  }
  return EXPERIENCES[DEFAULT_EXPERIENCE_ID];
}

export function listExperiences(): ExperienceDefinition[] {
  return Object.values(EXPERIENCES);
}
