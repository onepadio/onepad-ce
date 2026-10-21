import { Environment } from "@react-three/drei";

import {
  EXPERIENCE_HDRIS,
  type ExperienceHdriKey,
} from "./assetUrls";

type ExperienceEnvironmentProps = {
  hdri: ExperienceHdriKey;
  /** Also paint the scene background from the HDRI */
  background?: boolean;
  /** 0–1 blur on the background (drei Environment) */
  blur?: number;
  /** Strength of IBL contribution on PBR materials */
  environmentIntensity?: number;
};

/**
 * Per-experience HDRI lighting (Poly Haven CC0 1K).
 * Mount inside a Suspense boundary.
 */
export default function ExperienceEnvironment({
  hdri,
  background = true,
  blur = 0.35,
  environmentIntensity = 1,
}: ExperienceEnvironmentProps) {
  return (
    <Environment
      files={EXPERIENCE_HDRIS[hdri]}
      background={background}
      blur={blur}
      environmentIntensity={environmentIntensity}
    />
  );
}
