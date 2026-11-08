import { app, protocol, session, type Session } from 'electron';
import fs from 'fs';
import http from 'http';
import https from 'https';
import path from 'path';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import log from 'electron-log';

/** Public CDN root mirroring src/renderer/assets/experiences/ */
export const EXPERIENCE_CDN_BASE =
  'https://onepad.lon1.cdn.digitaloceanspaces.com/assets/experiences';

/**
 * Local bridge for Three.js. Renderer must NOT fetch the CDN (CORS).
 * Main downloads with Node https (not net.fetch — Spaces serves .hdr as
 * text/plain and Chromium fetch can corrupt binary bodies).
 */
export const EXPERIENCE_ASSET_SCHEME = 'onepad-asset';

export type ExperienceAssetProgress = {
  relativePath: string;
  index: number;
  total: number;
  receivedBytes: number;
  totalBytes: number | null;
  fraction: number;
  phase: 'checking' | 'download' | 'done' | 'error';
  error?: string;
};

type ProgressEmitter = (progress: ExperienceAssetProgress) => void;

const inFlight = new Map<string, Promise<string>>();
const sessionsWithProtocol = new WeakSet<Session>();

function getCacheRoot(): string {
  return path.join(app.getPath('userData'), 'experience-assets');
}

export function sanitizeExperienceRelativePath(relativePath: string): string {
  if (typeof relativePath !== 'string' || !relativePath.trim()) {
    throw new Error('Invalid experience asset path');
  }
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  if (
    normalized.includes('..') ||
    normalized.startsWith('/') ||
    /^[a-zA-Z]:/.test(normalized)
  ) {
    throw new Error(`Unsafe experience asset path: ${relativePath}`);
  }
  if (!/^[a-zA-Z0-9._\-/]+$/.test(normalized)) {
    throw new Error(`Invalid experience asset path chars: ${relativePath}`);
  }
  return normalized;
}

function localPathFor(relativePath: string): string {
  const safe = sanitizeExperienceRelativePath(relativePath);
  const full = path.join(getCacheRoot(), ...safe.split('/'));
  const root = getCacheRoot();
  if (!full.startsWith(root + path.sep) && full !== root) {
    throw new Error('Experience asset path escaped cache root');
  }
  return full;
}

function cdnUrlFor(relativePath: string): string {
  const safe = sanitizeExperienceRelativePath(relativePath);
  return `${EXPERIENCE_CDN_BASE}/${safe}`;
}

export function loaderUrlFor(relativePath: string): string {
  const safe = sanitizeExperienceRelativePath(relativePath);
  return `${EXPERIENCE_ASSET_SCHEME}://local/${safe}`;
}

function relativePathFromLoaderUrl(requestUrl: string): string {
  const u = new URL(requestUrl);
  const fromPath = decodeURIComponent(u.pathname || '').replace(/^\/+/, '');
  if (fromPath) return sanitizeExperienceRelativePath(fromPath);
  const combined = `${u.hostname}${u.pathname}`.replace(/^local\/?/, '');
  return sanitizeExperienceRelativePath(combined.replace(/\/+$/, ''));
}

function contentTypeFor(filePath: string): string {
  switch (path.extname(filePath).toLowerCase()) {
    case '.hdr':
      return 'image/vnd.radiance';
    case '.glb':
      return 'model/gltf-binary';
    case '.gltf':
      return 'model/gltf+json';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
}

/** Sidecar stores expected byte size from CDN Content-Length for integrity. */
function metaPathFor(destPath: string): string {
  return `${destPath}.meta.json`;
}

async function writeMeta(
  destPath: string,
  totalBytes: number | null
): Promise<void> {
  if (totalBytes == null || !(totalBytes > 0)) return;
  await fs.promises.writeFile(
    metaPathFor(destPath),
    JSON.stringify({ size: totalBytes }),
    'utf8'
  );
}

async function isCached(relativePath: string): Promise<boolean> {
  try {
    const dest = localPathFor(relativePath);
    const st = await fs.promises.stat(dest);
    if (!st.isFile() || st.size <= 0) return false;
    try {
      const meta = JSON.parse(
        await fs.promises.readFile(metaPathFor(dest), 'utf8')
      );
      if (typeof meta?.size === 'number' && meta.size !== st.size) {
        log.warn(
          '[experience-assets] size mismatch, re-download',
          relativePath,
          st.size,
          meta.size
        );
        return false;
      }
    } catch {
      // Legacy cache without meta — trust size > 0; HDR corruption will
      // force re-download once meta is written by a fresh download.
      // Treat missing meta as stale for .hdr (known Chromium text/plain issue).
      if (dest.toLowerCase().endsWith('.hdr')) return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Binary-safe download via Node https/http (avoids Electron net.fetch
 * mangling bodies when Spaces Content-Type is text/plain).
 */
function downloadToFile(
  remoteUrl: string,
  destPath: string,
  onBytes?: (received: number, total: number | null) => void
): Promise<void> {
  const maxRedirects = 5;

  const attempt = (url: string, redirectsLeft: number): Promise<void> =>
    new Promise((resolve, reject) => {
      const mod = url.startsWith('https:') ? https : http;
      const req = mod.get(
        url,
        {
          headers: {
            Accept: '*/*',
            'User-Agent': `OnePad/${app.getVersion()}`,
          },
        },
        (res) => {
          const status = res.statusCode || 0;
          if (
            status >= 300 &&
            status < 400 &&
            res.headers.location &&
            redirectsLeft > 0
          ) {
            res.resume();
            const next = new URL(res.headers.location, url).href;
            attempt(next, redirectsLeft - 1).then(resolve, reject);
            return;
          }
          if (status !== 200) {
            res.resume();
            reject(new Error(`HTTP ${status} fetching ${url}`));
            return;
          }

          const totalHeader = res.headers['content-length'];
          const totalBytes = totalHeader ? Number(totalHeader) : null;
          let received = 0;
          const tmpPath = `${destPath}.tmp-${process.pid}-${Date.now()}`;

          fs.promises
            .mkdir(path.dirname(destPath), { recursive: true })
            .then(() => {
              const out = fs.createWriteStream(tmpPath);
              res.on('data', (chunk: Buffer) => {
                received += chunk.length;
                onBytes?.(received, totalBytes);
              });
              return pipeline(res, out).then(async () => {
                if (totalBytes != null && received !== totalBytes) {
                  try {
                    await fs.promises.unlink(tmpPath);
                  } catch {
                    /* ignore */
                  }
                  throw new Error(
                    `Incomplete download for ${url}: got ${received}, expected ${totalBytes}`
                  );
                }
                await fs.promises.rename(tmpPath, destPath);
                await writeMeta(destPath, totalBytes ?? received);
              });
            })
            .then(resolve)
            .catch(async (err) => {
              try {
                await fs.promises.unlink(
                  `${destPath}.tmp-${process.pid}-${Date.now()}`
                );
              } catch {
                /* ignore */
              }
              reject(err);
            });
        }
      );
      req.on('error', reject);
    });

  return attempt(remoteUrl, maxRedirects);
}

export async function ensureExperienceAsset(
  relativePath: string,
  onProgress?: ProgressEmitter
): Promise<string> {
  const safe = sanitizeExperienceRelativePath(relativePath);
  const existing = inFlight.get(safe);
  if (existing) return existing;

  const work = (async () => {
    if (await isCached(safe)) {
      onProgress?.({
        relativePath: safe,
        index: 0,
        total: 1,
        receivedBytes: 0,
        totalBytes: null,
        fraction: 1,
        phase: 'done',
      });
      return loaderUrlFor(safe);
    }

    const dest = localPathFor(safe);
    const remote = cdnUrlFor(safe);
    log.info('[experience-assets] downloading', remote);
    await downloadToFile(remote, dest, (received, total) => {
      const fraction = total && total > 0 ? Math.min(1, received / total) : 0;
      onProgress?.({
        relativePath: safe,
        index: 0,
        total: 1,
        receivedBytes: received,
        totalBytes: total,
        fraction,
        phase: 'download',
      });
    });
    log.info('[experience-assets] cached', dest);
    onProgress?.({
      relativePath: safe,
      index: 0,
      total: 1,
      receivedBytes: 0,
      totalBytes: null,
      fraction: 1,
      phase: 'done',
    });
    return loaderUrlFor(safe);
  })().finally(() => {
    inFlight.delete(safe);
  });

  inFlight.set(safe, work);
  return work;
}

export async function ensureExperienceAssetPack(
  relativePaths: string[],
  onProgress?: ProgressEmitter
): Promise<string[]> {
  const unique = [
    ...new Set(relativePaths.map((p) => sanitizeExperienceRelativePath(p))),
  ];
  const urls: string[] = [];
  const total = unique.length;

  for (let i = 0; i < unique.length; i++) {
    const safe = unique[i];
    onProgress?.({
      relativePath: safe,
      index: i,
      total,
      receivedBytes: 0,
      totalBytes: null,
      fraction: total === 0 ? 1 : i / total,
      phase: 'checking',
    });

    try {
      const url = await ensureExperienceAsset(safe, (p) => {
        const fileFrac = p.fraction;
        onProgress?.({
          ...p,
          index: i,
          total,
          fraction:
            total === 0
              ? 1
              : (i + (p.phase === 'done' ? 1 : Math.min(1, fileFrac))) / total,
        });
      });
      urls.push(url);
    } catch (err: any) {
      const message = err?.message || String(err);
      onProgress?.({
        relativePath: safe,
        index: i,
        total,
        receivedBytes: 0,
        totalBytes: null,
        fraction: total === 0 ? 1 : i / total,
        phase: 'error',
        error: message,
      });
      throw err;
    }
  }

  return urls;
}

export function registerExperienceAssetScheme(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: EXPERIENCE_ASSET_SCHEME,
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        corsEnabled: true,
        stream: true,
        bypassCSP: true,
      },
    },
  ]);
}

async function handleExperienceAssetRequest(
  request: Request
): Promise<Response> {
  try {
    const relative = relativePathFromLoaderUrl(request.url);
    const filePath = localPathFor(relative);
    const st = await fs.promises.stat(filePath);
    if (!st.isFile()) {
      return new Response('Not Found', { status: 404 });
    }

    const type = contentTypeFor(filePath);
    // Buffer small assets (HDR/textures) — RGBELoader is picky about streams.
    // Stream large GLBs to avoid loading 100MB+ into memory.
    const STREAM_THRESHOLD = 8 * 1024 * 1024;
    if (st.size <= STREAM_THRESHOLD) {
      const buf = await fs.promises.readFile(filePath);
      return new Response(buf, {
        status: 200,
        headers: {
          'Content-Type': type,
          'Content-Length': String(buf.byteLength),
          'Cache-Control': 'no-cache',
        },
      });
    }

    const nodeStream = fs.createReadStream(filePath);
    const webStream = Readable.toWeb(nodeStream) as ReadableStream;
    return new Response(webStream, {
      status: 200,
      headers: {
        'Content-Type': type,
        'Content-Length': String(st.size),
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    log.error('[experience-assets] protocol error', err);
    return new Response('Not Found', { status: 404 });
  }
}

export function registerExperienceAssetProtocolOnSession(ses: Session): void {
  if (sessionsWithProtocol.has(ses)) return;
  try {
    if (ses.protocol.isProtocolHandled(EXPERIENCE_ASSET_SCHEME)) {
      sessionsWithProtocol.add(ses);
      return;
    }
    ses.protocol.handle(EXPERIENCE_ASSET_SCHEME, handleExperienceAssetRequest);
    sessionsWithProtocol.add(ses);
    log.info('[experience-assets] protocol registered on session');
  } catch (err) {
    log.warn('[experience-assets] protocol handle failed', err);
  }
}

export function registerExperienceAssetProtocol(): void {
  fs.mkdirSync(getCacheRoot(), { recursive: true });
  registerExperienceAssetProtocolOnSession(session.defaultSession);
}
