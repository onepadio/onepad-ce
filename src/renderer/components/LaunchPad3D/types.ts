export type Launchpad3dLayoutId = "coverflow" | "mission" | "ring" | "scene";

export type LaunchpadVisualMode = "2d" | "3d";

export type CardKind = "app" | "link" | "tab";

export interface LaunchPadCard {
  id: string;
  title: string;
  imageUrl: string | null;
  kind: CardKind;
  /** Optional subtitle under the card (e.g. URL) */
  subtitle?: string;
  /** True when this card maps to the currently active window/tab */
  isActive?: boolean;
  /** True when tab/window is sleeping */
  isSleeping?: boolean;
  /** True when a live active tab exists — show webview; otherwise show icon */
  hasLiveTab?: boolean;
  /**
   * How to paint imageUrl on the mesh:
   * - screenshot: full-bleed preview
   * - icon: small centered favicon/app icon (no live tab / no shot)
   */
  previewMode?: "screenshot" | "icon";
}

export interface CardPose {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  opacity: number;
}

export interface LayoutComputeArgs {
  index: number;
  count: number;
  focusedIndex: number;
  /** Extra offset for ring/coverflow browsing (fractional) */
  browseOffset: number;
  /** Desk worlds: seat is fixed; poses are relative to focusedIndex */
  deskFixed?: boolean;
  /** Continuous desk-carousel drag yaw (radians) */
  sceneAngleOffset?: number;
}
