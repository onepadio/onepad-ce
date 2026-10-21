/**
 * Bundled Poly Haven CC0 experience assets (see assets/experiences/CREDITS.md).
 */
import metalOfficeDeskUrl from "../../../assets/experiences/shared/metal_office_desk/metal_office_desk.glb";
import modernArmChairUrl from "../../../assets/experiences/shared/modern_arm_chair_01/modern_arm_chair_01.glb";
import roundWoodenTableUrl from "../../../assets/experiences/shared/round_wooden_table_01/round_wooden_table_01.glb";
import pottedPlantUrl from "../../../assets/experiences/shared/potted_plant_01/potted_plant_01.glb";
import binderNotebookUrl from "../../../assets/experiences/shared/binder_notebook/binder_notebook.glb";
import stationerySuppliesUrl from "../../../assets/experiences/shared/stationery_supplies/stationery_supplies.glb";
import standingPictureFrameUrl from "../../../assets/experiences/shared/standing_picture_frame_01/standing_picture_frame_01.glb";
import rock01Url from "../../../assets/experiences/desert-pyramids/rock_01/rock_01.glb";
import boulder01Url from "../../../assets/experiences/desert-pyramids/boulder_01/boulder_01.glb";
import rockMossUrl from "../../../assets/experiences/mountain-lodge/rock_moss_set_01/rock_moss_set_01.glb";
import steelShelvesUrl from "../../../assets/experiences/library-hall/steel_frame_shelves_01/steel_frame_shelves_01.glb";
import woodShelvesUrl from "../../../assets/experiences/library-hall/wooden_display_shelves_01/wooden_display_shelves_01.glb";
import woodenBookshelfWornUrl from "../../../assets/experiences/library-hall/wooden_bookshelf_worn/wooden_bookshelf_worn.glb";
import bookEncyclopediaUrl from "../../../assets/experiences/library-hall/book_encyclopedia_set_01/book_encyclopedia_set_01.glb";
import sketchfabLibraryUrl from "../../../assets/experiences/library-hall/sketchfab_library/library.glb";
import blenderOfficeUrl from "../../../assets/experiences/office-tower/blender_office/office_interior.glb";
import blenderVictorianStudyUrl from "../../../assets/experiences/victorian-study/blender_study/victorian_study.glb";

import desertHdriUrl from "../../../assets/experiences/hdris/desert_1k.hdr";
import officeHdriUrl from "../../../assets/experiences/hdris/office_1k.hdr";
import lodgeHdriUrl from "../../../assets/experiences/hdris/lodge_1k.hdr";
import forestHdriUrl from "../../../assets/experiences/hdris/forest_1k.hdr";
import indoorHdriUrl from "../../../assets/experiences/hdris/indoor_1k.hdr";
import nightHdriUrl from "../../../assets/experiences/hdris/night_1k.hdr";
import sunsetHdriUrl from "../../../assets/experiences/hdris/sunset_1k.hdr";
import readingRoomHdriUrl from "../../../assets/experiences/hdris/reading_room_1k.hdr";
import oldHallHdriUrl from "../../../assets/experiences/hdris/old_hall_1k.hdr";

import woodFloorDiffUrl from "../../../assets/experiences/library-hall/textures/wood_floor/wood_floor_diff_1k.jpg";
import woodFloorNorUrl from "../../../assets/experiences/library-hall/textures/wood_floor/wood_floor_nor_gl_1k.jpg";
import woodFloorArmUrl from "../../../assets/experiences/library-hall/textures/wood_floor/wood_floor_arm_1k.jpg";
import clayPlasterDiffUrl from "../../../assets/experiences/library-hall/textures/clay_plaster/clay_plaster_diff_1k.jpg";
import clayPlasterNorUrl from "../../../assets/experiences/library-hall/textures/clay_plaster/clay_plaster_nor_gl_1k.jpg";
import clayPlasterArmUrl from "../../../assets/experiences/library-hall/textures/clay_plaster/clay_plaster_arm_1k.jpg";

export const EXPERIENCE_MODELS = {
  metalOfficeDesk: metalOfficeDeskUrl,
  modernArmChair: modernArmChairUrl,
  roundWoodenTable: roundWoodenTableUrl,
  pottedPlant: pottedPlantUrl,
  binderNotebook: binderNotebookUrl,
  stationerySupplies: stationerySuppliesUrl,
  standingPictureFrame: standingPictureFrameUrl,
  rock01: rock01Url,
  boulder01: boulder01Url,
  rockMoss: rockMossUrl,
  steelShelves: steelShelvesUrl,
  woodShelves: woodShelvesUrl,
  woodenBookshelfWorn: woodenBookshelfWornUrl,
  bookEncyclopedia: bookEncyclopediaUrl,
  /** Sketchfab CC-BY “library” by Pasha — full hall interior */
  sketchfabLibrary: sketchfabLibraryUrl,
  /** Blender-built modern open-plan office for Office Building */
  blenderOffice: blenderOfficeUrl,
  /** Blender Victorian study (Sketchfab props + Poly Haven floor/HDRI) */
  blenderVictorianStudy: blenderVictorianStudyUrl,
} as const;

export const EXPERIENCE_HDRIS = {
  desert: desertHdriUrl,
  office: officeHdriUrl,
  lodge: lodgeHdriUrl,
  forest: forestHdriUrl,
  indoor: indoorHdriUrl,
  night: nightHdriUrl,
  sunset: sunsetHdriUrl,
  readingRoom: readingRoomHdriUrl,
  oldHall: oldHallHdriUrl,
} as const;

export type ExperienceHdriKey = keyof typeof EXPERIENCE_HDRIS;

/** Poly Haven CC0 PBR maps for Library Hall architecture */
export const LIBRARY_TEXTURES = {
  woodFloor: {
    map: woodFloorDiffUrl,
    normalMap: woodFloorNorUrl,
    armMap: woodFloorArmUrl,
  },
  clayPlaster: {
    map: clayPlasterDiffUrl,
    normalMap: clayPlasterNorUrl,
    armMap: clayPlasterArmUrl,
  },
} as const;
