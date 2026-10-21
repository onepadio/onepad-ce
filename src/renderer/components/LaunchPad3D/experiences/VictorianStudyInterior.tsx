import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

import { ARENA_FLOOR_Y, getDeskArenaRadius } from "../layouts/roomScreens";
import { EXPERIENCE_MODELS } from "./assetUrls";

/**
 * Blender Victorian study — design clear ~4.5 m to walls.
 * The whole GLB (shell + furniture) scales uniformly so the app matches
 * Blender proportions. Do not counter-scale furniture — that made props
 * look like miniatures next to enlarged walls/windows.
 */
const DESIGN_CLEAR_R = 4.5;
const WALL_CLEAR_BEYOND_DESK = 4.0;

const ROOM_ANCHOR_NAMES = ["Floor"];

/** Used for material side / dome handling — not for split scaling. */
function isRoomShell(name: string): boolean {
  return (
    name === "Floor" ||
    name === "Ceiling" ||
    name === "ExteriorDome" ||
    name.startsWith("ExteriorDome") ||
    name.startsWith("Wall_") ||
    name.startsWith("Wainscot_") ||
    name.startsWith("Base_") ||
    name.startsWith("WindowFrame") ||
    name.startsWith("Painting_")
  );
}

function isExteriorDomeMesh(mesh: THREE.Mesh, mats: THREE.Material[]): boolean {
  return (
    mesh.name === "ExteriorDome" ||
    mesh.name.startsWith("ExteriorDome") ||
    mats.some((m) => m.name?.includes("ExteriorDome"))
  );
}

function findAnchor(root: THREE.Object3D): THREE.Object3D | null {
  for (const name of ROOM_ANCHOR_NAMES) {
    const hit = root.getObjectByName(name);
    if (hit) return hit;
  }
  return null;
}

export default function VictorianStudyInterior() {
  const { scene } = useGLTF(EXPERIENCE_MODELS.blenderVictorianStudy);
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
      const mats = Array.isArray(mesh.material)
        ? mesh.material
        : mesh.material
          ? [mesh.material]
          : [];
      const isDome = isExteriorDomeMesh(mesh, mats);
      mesh.castShadow = !isDome;
      mesh.receiveShadow = !isDome;
      mats.forEach((m) => {
        const std = m as THREE.MeshStandardMaterial;
        if (std.map) std.map.colorSpace = THREE.SRGBColorSpace;
        if (std.emissiveMap) std.emissiveMap.colorSpace = THREE.SRGBColorSpace;
        if ("envMapIntensity" in std) std.envMapIntensity = 0.2;
        if ("roughness" in std && typeof std.roughness === "number") {
          std.roughness = Math.max(std.roughness ?? 0.7, 0.72);
        }
        if ("emissiveIntensity" in std && !isDome) {
          std.emissiveIntensity = Math.min(std.emissiveIntensity || 0, 0.25);
        }
        std.depthTest = true;
        std.depthWrite = true;
        std.transparent = false;
        std.opacity = 1;
        if (isDome) {
          std.side = THREE.BackSide;
          std.toneMapped = true;
          if (std.map && !std.emissiveMap) std.emissiveMap = std.map;
          std.emissive = new THREE.Color(0xffffff);
          std.emissiveIntensity = 0.45;
          std.roughness = 1;
          std.metalness = 0;
        } else if (isRoomShell(mesh.name)) {
          std.side = THREE.DoubleSide;
        }
        std.needsUpdate = true;
      });
    });
    lightsToRemove.forEach((l) => l.parent?.remove(l));

    // Ground and center using the Floor plate only (ignore props / dome)
    const anchor = findAnchor(cloned) ?? cloned;
    const floorBox = new THREE.Box3().setFromObject(anchor);
    const floorCenter = new THREE.Vector3();
    floorBox.getCenter(floorCenter);

    cloned.position.x -= floorCenter.x;
    cloned.position.z -= floorCenter.z;
    cloned.position.y -= floorBox.min.y;

    const needClear = radius + WALL_CLEAR_BEYOND_DESK;
    const fitScale = Math.max(1, needClear / DESIGN_CLEAR_R);

    const g = new THREE.Group();
    g.add(cloned);
    g.scale.setScalar(fitScale);
    g.updateMatrixWorld(true);

    return g;
  }, [scene, radius]);

  return <primitive object={root} position={[0, ARENA_FLOOR_Y, 0]} />;
}

useGLTF.preload(EXPERIENCE_MODELS.blenderVictorianStudy);
