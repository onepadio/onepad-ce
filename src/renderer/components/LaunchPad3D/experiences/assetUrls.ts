/**
 * Experience assets live on DigitalOcean Spaces CDN and are downloaded into
 * Electron userData on first use (see main/experienceAssets.ts).
 * Values are paths relative to:
 *   https://onepad.lon1.cdn.digitaloceanspaces.com/assets/experiences/
 * (same layout as src/renderer/assets/experiences/).
 */

export const EXPERIENCE_CDN_BASE =
  "https://onepad.lon1.cdn.digitaloceanspaces.com/assets/experiences";

export const EXPERIENCE_MODELS = {
  metalOfficeDesk: "shared/metal_office_desk/metal_office_desk.glb",
  modernArmChair: "shared/modern_arm_chair_01/modern_arm_chair_01.glb",
  roundWoodenTable: "shared/round_wooden_table_01/round_wooden_table_01.glb",
  pottedPlant: "shared/potted_plant_01/potted_plant_01.glb",
  binderNotebook: "shared/binder_notebook/binder_notebook.glb",
  stationerySupplies: "shared/stationery_supplies/stationery_supplies.glb",
  standingPictureFrame:
    "shared/standing_picture_frame_01/standing_picture_frame_01.glb",
  rock01: "desert-pyramids/rock_01/rock_01.glb",
  boulder01: "desert-pyramids/boulder_01/boulder_01.glb",
  /** Blender desert plateau + Giza pyramids (Sketchfab + Poly Haven) */
  blenderDesertPyramids:
    "desert-pyramids/blender_pyramids/desert_pyramids.glb",
  rockMoss: "mountain-lodge/rock_moss_set_01/rock_moss_set_01.glb",
  steelShelves: "library-hall/steel_frame_shelves_01/steel_frame_shelves_01.glb",
  woodShelves:
    "library-hall/wooden_display_shelves_01/wooden_display_shelves_01.glb",
  woodenBookshelfWorn:
    "library-hall/wooden_bookshelf_worn/wooden_bookshelf_worn.glb",
  bookEncyclopedia:
    "library-hall/book_encyclopedia_set_01/book_encyclopedia_set_01.glb",
  /** Sketchfab CC-BY “library” by Pasha — full hall interior */
  sketchfabLibrary: "library-hall/sketchfab_library/library.glb",
  /** Blender-built modern open-plan office for Office Building */
  blenderOffice: "office-tower/blender_office/office_interior.glb",
  /** Blender Victorian study (Sketchfab props + Poly Haven floor/HDRI) */
  blenderVictorianStudy: "victorian-study/blender_study/victorian_study.glb",
} as const;

export type ExperienceModelKey = keyof typeof EXPERIENCE_MODELS;

export const EXPERIENCE_HDRIS = {
  desert: "hdris/desert_1k.hdr",
  office: "hdris/office_1k.hdr",
  lodge: "hdris/lodge_1k.hdr",
  forest: "hdris/forest_1k.hdr",
  indoor: "hdris/indoor_1k.hdr",
  night: "hdris/night_1k.hdr",
  sunset: "hdris/sunset_1k.hdr",
  readingRoom: "hdris/reading_room_1k.hdr",
  oldHall: "hdris/old_hall_1k.hdr",
} as const;

export type ExperienceHdriKey = keyof typeof EXPERIENCE_HDRIS;

/** Poly Haven CC0 PBR maps for Library Hall architecture */
export const LIBRARY_TEXTURES = {
  woodFloor: {
    map: "library-hall/textures/wood_floor/wood_floor_diff_1k.jpg",
    normalMap: "library-hall/textures/wood_floor/wood_floor_nor_gl_1k.jpg",
    armMap: "library-hall/textures/wood_floor/wood_floor_arm_1k.jpg",
  },
  clayPlaster: {
    map: "library-hall/textures/clay_plaster/clay_plaster_diff_1k.jpg",
    normalMap: "library-hall/textures/clay_plaster/clay_plaster_nor_gl_1k.jpg",
    armMap: "library-hall/textures/clay_plaster/clay_plaster_arm_1k.jpg",
  },
} as const;
