import { Suspense } from "react";

import { EXPERIENCE_MODELS } from "./assetUrls";
import GltfProp from "./GltfProp";

type DeskSurfacePropsProps = {
  /** World Y of the desk top surface */
  topY: number;
};

/**
 * Personal items on the circular user desk, placed toward the monitor ring (−Z)
 * so they sit in the seated / work-camera view (not behind the seat at +Z).
 * Poly Haven CC0 — see assets/experiences/CREDITS.md.
 */
export default function DeskSurfaceProps({ topY }: DeskSurfacePropsProps) {
  // Slightly above the slab so thin models don't z-fight the laminate.
  const y = topY + 0.002;

  return (
    <Suspense fallback={null}>
      {/* Closed leather notebook — right of center, toward screens */}
      <GltfProp
        url={EXPERIENCE_MODELS.binderNotebook}
        position={[0.55, y, -1.15]}
        rotation={[0, 0.4, 0]}
        fitTo={0.32}
        fitMode="width"
        sitOnGround
      />
      {/* Pen cup + pens */}
      <GltfProp
        url={EXPERIENCE_MODELS.stationerySupplies}
        position={[0.95, y, -0.85]}
        rotation={[0, -0.25, 0]}
        fitTo={0.18}
        fitMode="height"
        sitOnGround
      />
      {/* Standing photo frame — left of center */}
      <GltfProp
        url={EXPERIENCE_MODELS.standingPictureFrame}
        position={[-0.65, y, -1.05]}
        rotation={[0, -0.55, 0]}
        fitTo={0.24}
        fitMode="height"
        sitOnGround
      />
    </Suspense>
  );
}
