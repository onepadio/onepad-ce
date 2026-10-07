import { useMemo } from "react";

import { getSceneScreenSlots, type ScreenSlot } from "./layouts/roomScreens";

interface MonitorBankProps {
  count: number;
  focusedIndex?: number;
  hoveredIndex?: number;
}

function MonitorBezel({
  slot,
  lit,
}: {
  slot: ScreenSlot;
  lit: boolean;
}) {
  const [x, y, z] = slot.position;
  const [rx, ry, rz] = slot.rotation;
  const frameW = slot.width + 0.14;
  const frameH = slot.height + 0.14;
  return (
    <group position={[x, y, z]} rotation={[rx, ry, rz]}>
      {/* Frame sits slightly behind the screen plane (local -Z = into wall) */}
      <mesh position={[0, 0, -0.04]} castShadow receiveShadow>
        <boxGeometry args={[frameW, frameH, 0.12]} />
        <meshStandardMaterial
          color={lit ? "#6a809c" : "#4a5d73"}
          metalness={0.45}
          roughness={0.4}
        />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[slot.width, slot.height]} />
        <meshStandardMaterial
          color="#0d1524"
          emissive={lit ? "#1a4a8c" : "#101828"}
          emissiveIntensity={lit ? 0.28 : 0.08}
          metalness={0.2}
          roughness={0.55}
        />
      </mesh>
    </group>
  );
}

/** Procedural monitor frames on the circular arena wall */
function MonitorBank({
  count,
  focusedIndex = -1,
  hoveredIndex = -1,
}: MonitorBankProps) {
  const slots = useMemo(() => getSceneScreenSlots(count), [count]);

  return (
    <group>
      {slots.map((slot, i) => (
        <MonitorBezel
          key={`mon-${i}`}
          slot={slot}
          lit={i === focusedIndex || i === hoveredIndex}
        />
      ))}
    </group>
  );
}

export default MonitorBank;
