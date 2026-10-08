import type * as THREE from "three";

/** Shared registry: card/window id → plane group for DOM projection */
const planes = new Map<string, THREE.Object3D>();

export function registerPlane(id: string, object: THREE.Object3D | null) {
  if (!object) {
    planes.delete(id);
    return;
  }
  planes.set(id, object);
}

export function unregisterPlane(id: string) {
  planes.delete(id);
}

export function getRegisteredPlanes(): ReadonlyMap<string, THREE.Object3D> {
  return planes;
}
