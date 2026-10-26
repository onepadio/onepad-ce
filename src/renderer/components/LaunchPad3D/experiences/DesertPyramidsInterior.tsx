import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

import { ARENA_FLOOR_Y, getDeskArenaRadius } from "../layouts/roomScreens";
import { EXPERIENCE_MODELS } from "./assetUrls";

/**
 * Blender desert / Giza vista — sand plate ~r=45 with clear desk island ~r=12.
 * Exterior pyramids sit on the horizon and must not shift centering.
 */
const DESIGN_CLEAR_R = 12;

const ROOM_ANCHOR_NAMES = ["DesertFloor", "Floor"];

function findAnchor(root: THREE.Object3D): THREE.Object3D | null {
  for (const name of ROOM_ANCHOR_NAMES) {
    const hit = root.getObjectByName(name);
    if (hit) return hit;
  }
  return null;
}

export default function DesertPyramidsInterior() {
  const { scene } = useGLTF(EXPERIENCE_MODELS.blenderDesertPyramids);
  const radius = getDeskArenaRadius();

  const root = useMemo(() => {
    const cloned = scene.clone(true);
    const lightsToRemove: THREE.Object3D[] = [];
    cloned.traverse((obj) => {
      if ((obj as THREE.Light).isLight) {
        lightsToRemove.push(obj);
        return;
      }
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
        if ("envMapIntensity" in std) std.envMapIntensity = 0.45;
        if ("roughness" in std && typeof std.roughness === "number") {
          std.roughness = Math.max(std.roughness ?? 0.8, 0.75);
        }
        std.needsUpdate = true;
      });
    });
    lightsToRemove.forEach((l) => l.parent?.remove(l));

    // Ground Y on DesertFloor only. Keep Blender design origin (desk clear
    // island at 0,0) — do NOT recenter XZ on the floor plate (it is offset
    // to cover the plateau and would drag Sphinx/props into the desk).
    const anchor = findAnchor(cloned) ?? cloned;
    const floorBox = new THREE.Box3().setFromObject(anchor);
    cloned.position.y -= floorBox.min.y;

    const needClear = radius + 2.5;
    const fitScale = Math.max(1, needClear / DESIGN_CLEAR_R);

    const g = new THREE.Group();
    g.add(cloned);
    g.scale.setScalar(fitScale);
    g.updateMatrixWorld(true);
    return g;
  }, [scene, radius]);

  return <primitive object={root} position={[0, ARENA_FLOOR_Y, 0]} />;
}

useGLTF.preload(EXPERIENCE_MODELS.blenderDesertPyramids);
