import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";

const textureCache = new Map<string, THREE.Texture>();

function loadTexture(url: string): Promise<THREE.Texture> {
  const cached = textureCache.get(url);
  if (cached) return Promise.resolve(cached);

  return new Promise((resolve, reject) => {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(
      url,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        textureCache.set(url, tex);
        resolve(tex);
      },
      undefined,
      reject
    );
  });
}

/**
 * Loads a texture for a card image URL. Returns null while loading / on failure.
 * Textures are cached by URL for the session.
 */
export function useCardTexture(imageUrl: string | null | undefined) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);

    if (!imageUrl) {
      setTexture(null);
      return;
    }

    loadTexture(imageUrl)
      .then((tex) => {
        if (!cancelled) setTexture(tex);
      })
      .catch(() => {
        if (!cancelled) {
          setTexture(null);
          setFailed(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  return useMemo(
    () => ({ texture, failed, ready: !!texture }),
    [texture, failed]
  );
}

export function disposeTextureCache() {
  textureCache.forEach((tex) => tex.dispose());
  textureCache.clear();
}
