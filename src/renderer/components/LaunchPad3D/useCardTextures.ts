import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";

const textureCache = new Map<string, THREE.Texture>();
const DATA_URL_CACHE_PREFIX = "card-tex:";

function configureTexture(tex: THREE.Texture) {
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

function isRemoteHttpUrl(url: string) {
  return url.startsWith("http://") || url.startsWith("https://");
}

function loadTextureFromImage(
  url: string,
  cacheKey: string = url
): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // data:/blob: are same-origin — no crossOrigin needed
    if (!url.startsWith("data:") && !url.startsWith("blob:")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => {
      const tex = configureTexture(new THREE.Texture(img));
      textureCache.set(cacheKey, tex);
      resolve(tex);
    };
    img.onerror = () =>
      reject(new Error(`Failed to load texture image: ${url}`));
    img.src = url;
  });
}

function readCachedDataUrl(url: string): string | null {
  try {
    const cached = localStorage.getItem(DATA_URL_CACHE_PREFIX + url);
    return cached?.startsWith("data:") ? cached : null;
  } catch {
    return null;
  }
}

function writeCachedDataUrl(url: string, dataUrl: string) {
  try {
    localStorage.setItem(DATA_URL_CACHE_PREFIX + url, dataUrl);
  } catch {
    /* quota — ignore */
  }
}

/**
 * Link favicons are https://… URLs. Renderer fetch is blocked by CSP connect-src,
 * and CORS Image taints WebGL. Main-process fetch returns a data URL instead.
 */
async function loadRemoteTexture(url: string): Promise<THREE.Texture> {
  const cachedData = readCachedDataUrl(url);
  if (cachedData) {
    return loadTextureFromImage(cachedData, url);
  }

  // @ts-expect-error electronAPI injected by preload
  const invoke = window.electronAPI?.invoke as
    | ((channel: string, ...args: unknown[]) => Promise<string>)
    | undefined;

  if (invoke) {
    const dataUrl = await invoke("fetch-image-data-url", url);
    if (typeof dataUrl === "string" && dataUrl.startsWith("data:")) {
      writeCachedDataUrl(url, dataUrl);
      return loadTextureFromImage(dataUrl, url);
    }
  }

  // Last resort (hosts that allow CORS)
  return loadTextureFromImage(url, url);
}

function loadTexture(url: string): Promise<THREE.Texture> {
  const cached = textureCache.get(url);
  if (cached) return Promise.resolve(cached);

  if (isRemoteHttpUrl(url)) {
    return loadRemoteTexture(url);
  }

  return new Promise((resolve, reject) => {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(
      url,
      (tex) => {
        configureTexture(tex);
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
