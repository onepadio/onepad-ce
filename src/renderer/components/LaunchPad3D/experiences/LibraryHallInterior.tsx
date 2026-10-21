import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

import { ARENA_FLOOR_Y, getDeskArenaRadius } from "../layouts/roomScreens";
import { EXPERIENCE_MODELS } from "./assetUrls";

/**
 * Sketchfab hall open floor is ~35–40% of the building footprint.
 * Scale so that open clear radius stays outside the monitor ring + pillars.
 */
const OPEN_FLOOR_RATIO = 0.36;

/**
 * Sketchfab “library” hall (CC-BY) — scaled so the desk + screens sit in the
 * central floor without clipping pillars or shelves.
 */
export default function LibraryHallInterior() {
  const { scene } = useGLTF(EXPERIENCE_MODELS.sketchfabLibrary);
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
        if ("roughness" in std && typeof std.roughness === "number") {
          std.roughness = Math.max(std.roughness ?? 0.7, 0.75);
        }
        if ("metalness" in std && typeof std.metalness === "number") {
          std.metalness = Math.min(std.metalness ?? 0, 0.12);
        }
        if ("envMapIntensity" in std) {
          std.envMapIntensity = 0.4;
        }
        std.needsUpdate = true;
      });
    });

    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    cloned.position.x -= center.x;
    cloned.position.z -= center.z;
    cloned.position.y -= box.min.y;

    const footprint = Math.max(size.x, size.z, 1e-3);
    // Clear diameter needed for screens + gap before pillars
    const clearDiameter = (radius + 3.8) * 2;
    const minFootprint = Math.max(58, clearDiameter / OPEN_FLOOR_RATIO);
    const fitScale = minFootprint / footprint;

    const g = new THREE.Group();
    g.add(cloned);
    g.scale.setScalar(fitScale);
    return g;
  }, [scene, radius]);

  return <primitive object={root} position={[0, ARENA_FLOOR_Y, 0]} />;
}

useGLTF.preload(EXPERIENCE_MODELS.sketchfabLibrary);
