import type { FC } from "react";

export type Desktop3dExperienceId =
  | "control-room"
  | "desert-pyramids"
  | "office-tower"
  | "space-station"
  | "library-hall"
  | "mountain-lodge";

export type ExperienceVistaProps = {
  count: number;
  /** When false, skip useFrame / ambient loops (warm space hidden) */
  active?: boolean;
};

export type ExperienceDefinition = {
  id: Desktop3dExperienceId;
  label: string;
  description: string;
  available: boolean;
  clearColor: number;
  cssClass: string;
  Vista: FC<ExperienceVistaProps>;
  /** Classic control-room arena sets this false (no desk/window shell). */
  usesDeskRoom?: boolean;
  motion?: {
    idleYawAmp?: number;
    idlePitchAmp?: number;
    idlePeriodSec?: number;
  };
};
