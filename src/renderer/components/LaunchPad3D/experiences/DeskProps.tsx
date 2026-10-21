import { Suspense } from "react";

import { ARENA_FLOOR_Y } from "../layouts/roomScreens";
import { EXPERIENCE_MODELS } from "./assetUrls";
import GltfProp from "./GltfProp";

/**
 * Shared realistic desk props (chair + plant) for every desk-room world.
 */
export default function DeskProps() {
  return (
    <Suspense fallback={null}>
      {/* Seat facing the front monitor bank (−Z) */}
      <GltfProp
        url={EXPERIENCE_MODELS.modernArmChair}
        position={[0, ARENA_FLOOR_Y, 0.85]}
        rotation={[0, Math.PI, 0]}
        fitTo={1.15}
        sitOnGround
      />
      <GltfProp
        url={EXPERIENCE_MODELS.pottedPlant}
        position={[1.65, ARENA_FLOOR_Y, 0.35]}
        rotation={[0, 0.6, 0]}
        fitTo={0.85}
        sitOnGround
      />
      <GltfProp
        url={EXPERIENCE_MODELS.pottedPlant}
        position={[-1.7, ARENA_FLOOR_Y, 0.4]}
        rotation={[0, -0.4, 0]}
        fitTo={0.7}
        scale={0.92}
        sitOnGround
      />
    </Suspense>
  );
}
