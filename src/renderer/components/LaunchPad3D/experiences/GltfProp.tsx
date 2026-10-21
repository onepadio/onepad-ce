import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

type FitMode = "max" | "width" | "height" | "depth";

type GltfPropProps = {
  url: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  /** Uniform scale applied after optional fit */
  scale?: number;
  /** Fit longest axis (or width/height/depth) to this world size */
  fitTo?: number;
  fitMode?: FitMode;
  /** Lift so the model's bounding-box bottom sits on y=0 of local group */
  sitOnGround?: boolean;
  castShadow?: boolean;
  receiveShadow?: boolean;
};

/**
 * Load a GLB, optionally normalize size, and render a cloned scene.
 * Safe to mount multiple instances of the same url (drei caches).
 */
export default function GltfProp({
  url,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  fitTo,
  fitMode = "max",
  sitOnGround = false,
  castShadow = true,
  receiveShadow = true,
}: GltfPropProps) {
  const { scene } = useGLTF(url);

  const root = useMemo(() => {
    const cloned = scene.clone(true);
    cloned.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = castShadow;
        mesh.receiveShadow = receiveShadow;
        if (mesh.material) {
          const mats = Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material];
          mats.forEach((m) => {
            const std = m as THREE.MeshStandardMaterial;
            if (std.map) std.map.colorSpace = THREE.SRGBColorSpace;
            std.needsUpdate = true;
          });
        }
      }
    });

    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    // Center on XZ; optionally put feet on y=0
    cloned.position.x -= center.x;
    cloned.position.z -= center.z;
    if (sitOnGround) {
      cloned.position.y -= box.min.y;
    } else {
      cloned.position.y -= center.y;
    }

    let fitScale = 1;
    if (typeof fitTo === "number" && fitTo > 0) {
      const dim =
        fitMode === "width"
          ? size.x
          : fitMode === "height"
            ? size.y
            : fitMode === "depth"
              ? size.z
              : Math.max(size.x, size.y, size.z);
      if (dim > 1e-4) fitScale = fitTo / dim;
    }

    const g = new THREE.Group();
    g.add(cloned);
    g.scale.setScalar(fitScale * scale);
    return g;
  }, [scene, scale, fitTo, fitMode, sitOnGround, castShadow, receiveShadow]);

  return (
    <primitive
      object={root}
      position={position}
      rotation={rotation}
    />
  );
}

/** Preload helpers for warm scene switches */
export function preloadExperienceModels(urls: string[]) {
  urls.forEach((u) => useGLTF.preload(u));
}
