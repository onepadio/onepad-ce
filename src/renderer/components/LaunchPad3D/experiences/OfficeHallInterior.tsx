import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

import { ARENA_FLOOR_Y, getDeskArenaRadius } from "../layouts/roomScreens";
import { EXPERIENCE_MODELS } from "./assetUrls";

/**
 * Blender open-plan office — clear carpet ~r=11.5, columns ~r=15.2.
 * Exterior city sits outside the glass and must NOT affect centering —
 * otherwise the bbox center shifts outdoors and the desk ends up outside.
 */
const DESIGN_CLEAR_R = 11.5;

/** Prefer these mesh names (Blender export) for room origin / floor. */
const ROOM_ANCHOR_NAMES = ["Floor", "DeskCarpet", "Ceiling"];

function findAnchor(root: THREE.Object3D): THREE.Object3D | null {
  for (const name of ROOM_ANCHOR_NAMES) {
    const hit = root.getObjectByName(name);
    if (hit) return hit;
  }
  return null;
}

export default function OfficeHallInterior() {
  const { scene } = useGLTF(EXPERIENCE_MODELS.blenderOffice);
  const radius = getDeskArenaRadius();

  const root = useMemo(() => {
    const cloned = scene.clone(true);
    cloned.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const mats = Array.isArray(mesh.material)
        ? mesh.material
        : mesh.material
          ? [mesh.material]
          : [];
      mats.forEach((m) => {
        const std = m as THREE.MeshStandardMaterial;
        if (std.map) std.map.colorSpace = THREE.SRGBColorSpace;
        if ("envMapIntensity" in std) std.envMapIntensity = 0.55;
        std.needsUpdate = true;
      });
    });

    // Center on the office floor plate only — ignore exterior city/park meshes.
    const anchor = findAnchor(cloned) ?? cloned;
    const roomBox = new THREE.Box3().setFromObject(anchor);
    const roomCenter = new THREE.Vector3();
    roomBox.getCenter(roomCenter);

    // Still ground the whole scene (city + room) to Y=0 using full min Y.
    const worldBox = new THREE.Box3().setFromObject(cloned);

    cloned.position.x -= roomCenter.x;
    cloned.position.z -= roomCenter.z;
    cloned.position.y -= worldBox.min.y;

    const needClear = radius + 3.5;
    const fitScale = Math.max(1, needClear / DESIGN_CLEAR_R);

    const g = new THREE.Group();
    g.add(cloned);
    g.scale.setScalar(fitScale);
    return g;
  }, [scene, radius]);

  return <primitive object={root} position={[0, ARENA_FLOOR_Y, 0]} />;
}

useGLTF.preload(EXPERIENCE_MODELS.blenderOffice);
