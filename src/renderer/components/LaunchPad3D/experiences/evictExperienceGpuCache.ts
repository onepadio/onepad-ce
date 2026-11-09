import * as THREE from "three";
import { useGLTF } from "@react-three/drei";

import { getExperienceAssetPack } from "./experienceAssetPacks";
import { localLoaderUrl } from "./useExperienceAsset";

/**
 * Drop a world's GPU / loader cache so only the active experience stays in
 * memory. Disk cache under userData is kept — next open reloads from disk.
 */
export function evictExperienceGpuCache(experienceId: string): void {
  const paths = getExperienceAssetPack(experienceId);
  for (const rel of paths) {
    const url = localLoaderUrl(rel);
    if (/\.(glb|gltf)$/i.test(rel)) {
      try {
        useGLTF.clear(url);
      } catch {
        /* ignore */
      }
    }
    try {
      THREE.Cache.remove(url);
    } catch {
      /* ignore */
    }
  }
}
