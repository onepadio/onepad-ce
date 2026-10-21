import { useLayoutEffect, useMemo } from "react";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

import { LIBRARY_TEXTURES } from "./assetUrls";

function configureMaps(
  map: THREE.Texture,
  normalMap: THREE.Texture,
  armMap: THREE.Texture,
  repeat: [number, number]
) {
  for (const t of [map, normalMap, armMap]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
    t.anisotropy = 8;
    t.needsUpdate = true;
  }
  map.colorSpace = THREE.SRGBColorSpace;
  // ARM: R=AO, G=Roughness, B=Metalness (Poly Haven convention)
  armMap.colorSpace = THREE.NoColorSpace;
  normalMap.colorSpace = THREE.NoColorSpace;
}

/**
 * Shared PBR materials for library architecture (Poly Haven wood + plaster).
 */
export function useLibraryMaterials() {
  const wood = useTexture({
    map: LIBRARY_TEXTURES.woodFloor.map,
    normalMap: LIBRARY_TEXTURES.woodFloor.normalMap,
    aoMap: LIBRARY_TEXTURES.woodFloor.armMap,
    roughnessMap: LIBRARY_TEXTURES.woodFloor.armMap,
    metalnessMap: LIBRARY_TEXTURES.woodFloor.armMap,
  });
  const plaster = useTexture({
    map: LIBRARY_TEXTURES.clayPlaster.map,
    normalMap: LIBRARY_TEXTURES.clayPlaster.normalMap,
    aoMap: LIBRARY_TEXTURES.clayPlaster.armMap,
    roughnessMap: LIBRARY_TEXTURES.clayPlaster.armMap,
    metalnessMap: LIBRARY_TEXTURES.clayPlaster.armMap,
  });

  useLayoutEffect(() => {
    configureMaps(wood.map, wood.normalMap, wood.aoMap, [6, 6]);
    configureMaps(plaster.map, plaster.normalMap, plaster.aoMap, [3, 2]);
  }, [wood, plaster]);

  const floorMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: wood.map,
        normalMap: wood.normalMap,
        // ARM packed: use as roughness/metalness; skip aoMap (needs uv2)
        roughnessMap: wood.roughnessMap,
        metalnessMap: wood.metalnessMap,
        normalScale: new THREE.Vector2(0.7, 0.7),
        roughness: 0.85,
        metalness: 0.02,
        color: "#c8a882",
      }),
    [wood]
  );

  const wallMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: plaster.map,
        normalMap: plaster.normalMap,
        roughnessMap: plaster.roughnessMap,
        metalnessMap: plaster.metalnessMap,
        normalScale: new THREE.Vector2(0.55, 0.55),
        roughness: 0.92,
        metalness: 0.0,
        color: "#e8d8c0",
        side: THREE.DoubleSide,
      }),
    [plaster]
  );

  const beamMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: wood.map,
        normalMap: wood.normalMap,
        roughnessMap: wood.roughnessMap,
        metalnessMap: wood.metalnessMap,
        roughness: 0.78,
        metalness: 0.04,
        color: "#8a6248",
      }),
    [wood]
  );

  return { floorMat, wallMat, beamMat };
}
