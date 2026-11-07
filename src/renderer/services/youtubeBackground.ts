export const YOUTUBE_BG_PREFIX = "youtube:";
export const YOUTUBE_PLAYLIST_PREFIX = "playlist:";
export const YOUTUBE_VIDEOS_PREFIX = "videos:";
const CUSTOM_PLAYLISTS_KEY = "youtubeBgCustomPlaylists";
const CUSTOM_VIDEOS_KEY = "youtubeBgCustomVideos";
const VIDEO_BG_ENABLED_KEY = "videoBgEnabled";
const VIDEO_BG_SOURCE_KEY = "videoBgSource";

export type YoutubeBgVideoPreset = {
  type: "video";
  id: string;
  title: string;
  start?: number;
};

export type YoutubeBgPlaylistPreset = {
  type: "playlist";
  id: string;
  title: string;
  /** Optional video id used only for grid thumbnail */
  thumbnailVideoId?: string;
};

export type YoutubeBgVideosPreset = {
  type: "videos";
  id: string;
  title: string;
  videoIds: string[];
};

export type YoutubeBgPreset =
  | YoutubeBgVideoPreset
  | YoutubeBgPlaylistPreset
  | YoutubeBgVideosPreset;

export type YoutubeBgSource =
  | { type: "video"; videoId: string; start: number }
  | { type: "playlist"; playlistId: string; videoId?: string }
  | { type: "videos"; videoIds: string[] };

export type CustomYoutubePlaylist = {
  id: string;
  title: string;
  thumbnailVideoId?: string;
};

export type CustomYoutubeVideo = {
  id: string;
  title: string;
  start?: number;
};

/** Preset ambient videos for the background picker. */
export const YOUTUBE_BG_PRESETS: YoutubeBgVideoPreset[] = [
  {
    type: "video",
    id: "1vZMGH8d6M8",
    title: "Lakeside Glass House Jazz",
    start: 0,
  },
  {
    type: "video",
    id: "hJjKTfM7QpY",
    title: "Lakeside Cabin Jazz",
    start: 0,
  },
  {
    type: "video",
    id: "5nNFqfc_Bn0",
    title: "Rainy Cabin Fireplace Jazz",
    start: 0,
  },
  {
    type: "video",
    id: "ApOVaQsElbk",
    title: "Lake House Porch Jazz",
    start: 0,
  },
  {
    type: "video",
    id: "RBehCbP_12c",
    title: "Lakeside Morning Jazz Cafe",
    start: 0,
  },
  {
    type: "video",
    id: "Dx5qFachd3A",
    title: "Jazz Piano Radio",
    start: 0,
  },
  {
    type: "video",
    id: "CfPxlb8-ZQ0",
    title: "Work & Study Lofi Jazz",
    start: 60,
  },
  {
    type: "video",
    id: "lTRiuFIWV54",
    title: "1 A.M. Study Session",
    start: 0,
  },
  {
    type: "video",
    id: "4xDzrJKXOOY",
    title: "Synthwave Radio",
    start: 0,
  },
];

/** Built-in playlist / mix presets for the background picker. */
export const YOUTUBE_PLAYLIST_PRESETS: Array<
  YoutubeBgPlaylistPreset | YoutubeBgVideosPreset
> = [
  {
    type: "videos",
    id: "onepad-lakeside-mix",
    title: "OnePad Lakeside Jazz Mix",
    videoIds: [
      "1vZMGH8d6M8",
      "hJjKTfM7QpY",
      "5nNFqfc_Bn0",
      "ApOVaQsElbk",
      "RBehCbP_12c",
    ],
  },
  {
    type: "playlist",
    id: "PLSgNOUwJaMBSyCbugm3CKxLn1SgJNVsQG",
    title: "Quiet Lo-fi Jazz Beats",
    thumbnailVideoId: "CfPxlb8-ZQ0",
  },
  {
    type: "playlist",
    id: "PLlMGc_Zepq4nWKl3l8fexAud-si9yZdAm",
    title: "Jazz for Study & Work",
    thumbnailVideoId: "Dx5qFachd3A",
  },
  {
    type: "playlist",
    id: "PLxFiKbGMSzbft1ud6vS08S6_Aw9ALLMu7",
    title: "Lounge Chill Out Vibes",
    thumbnailVideoId: "lTRiuFIWV54",
  },
];

export function encodeYoutubeBackground(videoId: string, start = 0): string {
  const id = videoId.trim();
  if (!id) return "";
  return start > 0
    ? `${YOUTUBE_BG_PREFIX}${id}@${start}`
    : `${YOUTUBE_BG_PREFIX}${id}`;
}

export function encodeYoutubePlaylistBackground(playlistId: string): string {
  const id = playlistId.trim();
  if (!id) return "";
  return `${YOUTUBE_BG_PREFIX}${YOUTUBE_PLAYLIST_PREFIX}${id}`;
}

export function encodeYoutubeVideosBackground(videoIds: string[]): string {
  const ids = videoIds.map((id) => id.trim()).filter(Boolean);
  if (!ids.length) return "";
  return `${YOUTUBE_BG_PREFIX}${YOUTUBE_VIDEOS_PREFIX}${ids.join(",")}`;
}

export function encodeYoutubeBgSource(source: YoutubeBgSource): string {
  if (source.type === "playlist") {
    return encodeYoutubePlaylistBackground(source.playlistId);
  }
  if (source.type === "videos") {
    return encodeYoutubeVideosBackground(source.videoIds);
  }
  return encodeYoutubeBackground(source.videoId, source.start);
}

export function isYoutubeHost(hostname: string): boolean {
  const host = hostname.replace(/^www\./, "").toLowerCase();
  return (
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "music.youtube.com" ||
    host === "youtu.be"
  );
}

export function isYoutubeBackground(value: unknown): boolean {
  if (typeof value !== "string" || !value) return false;
  if (value.startsWith(YOUTUBE_BG_PREFIX)) return true;
  try {
    return isYoutubeHost(new URL(value).hostname);
  } catch {
    return false;
  }
}

/** Convert a stored source (encoded or full URL) into a browsable YouTube URL. */
export function youtubeSourceToBrowseUrl(value: string): string | null {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) {
    return isYoutubeBackground(value) ? value : null;
  }
  const parsed = parseYoutubeBackground(value);
  if (!parsed) return null;
  if (parsed.type === "playlist") {
    return `https://www.youtube.com/playlist?list=${parsed.playlistId}`;
  }
  if (parsed.type === "videos") {
    return `https://www.youtube.com/watch?v=${parsed.videoIds[0]}`;
  }
  return parsed.start > 0
    ? `https://www.youtube.com/watch?v=${parsed.videoId}&t=${parsed.start}`
    : `https://www.youtube.com/watch?v=${parsed.videoId}`;
}

export const YOUTUBE_BG_HOME_URL = "https://www.youtube.com/";
export const YOUTUBE_MUSIC_HOME_URL = "https://music.youtube.com/";
export const YOUTUBE_BG_PARTITION = "persist:youtube-bg";
const LAST_WATCH_SOURCE_KEY = "videoBgLastWatchSource";

export function isYoutubeMusicSource(value: unknown): boolean {
  if (typeof value !== "string" || !value) return false;
  try {
    const host = new URL(value).hostname.replace(/^www\./, "").toLowerCase();
    return host === "music.youtube.com";
  } catch {
    return false;
  }
}

export function readLastWatchVideoSource(): string {
  try {
    const value = localStorage.getItem(LAST_WATCH_SOURCE_KEY);
    if (value && isYoutubeBackground(value) && !isYoutubeMusicSource(value)) {
      return value;
    }
  } catch {
    // ignore
  }
  return YOUTUBE_BG_HOME_URL;
}

export function writeLastWatchVideoSource(source: string) {
  if (!source || isYoutubeMusicSource(source)) return;
  try {
    localStorage.setItem(LAST_WATCH_SOURCE_KEY, source);
  } catch {
    // ignore
  }
}

export function parseYoutubeBackground(value: string): YoutubeBgSource | null {
  if (typeof value !== "string" || !value.startsWith(YOUTUBE_BG_PREFIX)) {
    return null;
  }
  const raw = value.slice(YOUTUBE_BG_PREFIX.length);
  if (!raw) return null;

  if (raw.startsWith(YOUTUBE_PLAYLIST_PREFIX)) {
    const playlistId = raw.slice(YOUTUBE_PLAYLIST_PREFIX.length).split("@")[0];
    if (!playlistId) return null;
    return { type: "playlist", playlistId };
  }

  if (raw.startsWith(YOUTUBE_VIDEOS_PREFIX)) {
    const videoIds = raw
      .slice(YOUTUBE_VIDEOS_PREFIX.length)
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    if (!videoIds.length) return null;
    return { type: "videos", videoIds };
  }

  const [videoId, startStr] = raw.split("@");
  if (!videoId || videoId.includes(":")) return null;
  const start = startStr ? Number.parseInt(startStr, 10) : 0;
  return {
    type: "video",
    videoId,
    start: Number.isFinite(start) && start > 0 ? start : 0,
  };
}

export function extractYoutubePlaylistId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (/^PL[\w-]{10,}$/i.test(trimmed) || /^UU[\w-]{10,}$/i.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./, "");
    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com" ||
      host === "youtu.be"
    ) {
      const list = url.searchParams.get("list");
      if (list && list.length >= 10) return list;
    }
  } catch {
    // not a URL
  }

  return null;
}

/**
 * Extract a YouTube video id from a watch/embed/short URL or a bare id.
 */
export function extractYoutubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Bare 11-char video id
  if (/^[\w-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id && /^[\w-]{11}$/.test(id) ? id : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      if (url.pathname === "/watch") {
        const id = url.searchParams.get("v");
        return id && /^[\w-]{11}$/.test(id) ? id : null;
      }
      const embedMatch = url.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{11})/);
      if (embedMatch) return embedMatch[1];
    }
  } catch {
    // not a URL
  }

  return null;
}

export type ParsedYoutubeInput =
  | { type: "video"; videoId: string }
  | { type: "playlist"; playlistId: string; videoId?: string };

/** Prefer playlist when a list= param is present. */
export function parseYoutubeInput(input: string): ParsedYoutubeInput | null {
  const playlistId = extractYoutubePlaylistId(input);
  const videoId = extractYoutubeVideoId(input);

  if (playlistId) {
    return { type: "playlist", playlistId, videoId: videoId || undefined };
  }
  if (videoId) {
    return { type: "video", videoId };
  }
  return null;
}

export function youtubeThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export function playlistThumbnailUrl(preset: {
  thumbnailVideoId?: string;
  videoIds?: string[];
}): string | null {
  const videoId = preset.thumbnailVideoId || preset.videoIds?.[0];
  return videoId ? youtubeThumbnailUrl(videoId) : null;
}

function sharedEmbedParams(): URLSearchParams {
  return new URLSearchParams({
    showinfo: "0",
    controls: "0",
    disablekb: "0",
    fs: "0",
    rel: "0",
    iv_load_policy: "3",
    autoplay: "1",
    mute: "0",
    modestbranding: "1",
    playsinline: "1",
    enablejsapi: "1",
    loop: "1",
  });
}

export function buildYoutubeEmbedUrl(
  source: YoutubeBgSource | string,
  start = 0
): string {
  const resolved: YoutubeBgSource =
    typeof source === "string"
      ? { type: "video", videoId: source, start }
      : source;

  const params = sharedEmbedParams();

  if (resolved.type === "playlist") {
    params.set("list", resolved.playlistId);
    params.set("listType", "playlist");
    if (resolved.videoId) {
      return `https://www.youtube.com/embed/${resolved.videoId}?${params.toString()}`;
    }
    return `https://www.youtube.com/embed/videoseries?${params.toString()}`;
  }

  if (resolved.type === "videos") {
    const [first, ...rest] = resolved.videoIds;
    const playlist = [first, ...rest].join(",");
    params.set("playlist", playlist);
    return `https://www.youtube.com/embed/${first}?${params.toString()}`;
  }

  params.set("playlist", resolved.videoId);
  if (resolved.start > 0) {
    params.set("start", String(resolved.start));
  } else if (start > 0) {
    params.set("start", String(start));
  }
  return `https://www.youtube.com/embed/${resolved.videoId}?${params.toString()}`;
}

export function readCustomYoutubePlaylists(): CustomYoutubePlaylist[] {
  try {
    const raw = localStorage.getItem(CUSTOM_PLAYLISTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        item &&
        typeof item.id === "string" &&
        typeof item.title === "string" &&
        item.id.length >= 10
    );
  } catch {
    return [];
  }
}

export function writeCustomYoutubePlaylists(playlists: CustomYoutubePlaylist[]) {
  try {
    localStorage.setItem(CUSTOM_PLAYLISTS_KEY, JSON.stringify(playlists));
  } catch {
    // ignore
  }
}

export function addCustomYoutubePlaylist(
  playlist: CustomYoutubePlaylist
): CustomYoutubePlaylist[] {
  const existing = readCustomYoutubePlaylists();
  const next = [
    playlist,
    ...existing.filter((item) => item.id !== playlist.id),
  ];
  writeCustomYoutubePlaylists(next);
  return next;
}

export function removeCustomYoutubePlaylist(playlistId: string): CustomYoutubePlaylist[] {
  const next = readCustomYoutubePlaylists().filter((item) => item.id !== playlistId);
  writeCustomYoutubePlaylists(next);
  return next;
}

export function readCustomYoutubeVideos(): CustomYoutubeVideo[] {
  try {
    const raw = localStorage.getItem(CUSTOM_VIDEOS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        item &&
        typeof item.id === "string" &&
        typeof item.title === "string" &&
        /^[\w-]{11}$/.test(item.id)
    );
  } catch {
    return [];
  }
}

export function writeCustomYoutubeVideos(videos: CustomYoutubeVideo[]) {
  try {
    localStorage.setItem(CUSTOM_VIDEOS_KEY, JSON.stringify(videos));
  } catch {
    // ignore
  }
}

export function addCustomYoutubeVideo(
  video: CustomYoutubeVideo
): CustomYoutubeVideo[] {
  const existing = readCustomYoutubeVideos();
  const next = [video, ...existing.filter((item) => item.id !== video.id)];
  writeCustomYoutubeVideos(next);
  return next;
}

export function removeCustomYoutubeVideo(videoId: string): CustomYoutubeVideo[] {
  const next = readCustomYoutubeVideos().filter((item) => item.id !== videoId);
  writeCustomYoutubeVideos(next);
  return next;
}

export function readVideoBgEnabled(): boolean {
  try {
    return localStorage.getItem(VIDEO_BG_ENABLED_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeVideoBgEnabled(enabled: boolean) {
  try {
    localStorage.setItem(VIDEO_BG_ENABLED_KEY, enabled ? "1" : "0");
  } catch {
    // ignore
  }
}

export function readVideoBgSource(): string {
  try {
    const value = localStorage.getItem(VIDEO_BG_SOURCE_KEY);
    return value && isYoutubeBackground(value) ? value : "";
  } catch {
    return "";
  }
}

export function writeVideoBgSource(source: string) {
  try {
    if (!source) {
      localStorage.removeItem(VIDEO_BG_SOURCE_KEY);
      return;
    }
    localStorage.setItem(VIDEO_BG_SOURCE_KEY, source);
  } catch {
    // ignore
  }
}

const MUTE_PREF_KEY = "youtubeBgMuted";

export function readYoutubeBgMutePreference(): boolean {
  try {
    const stored = localStorage.getItem(MUTE_PREF_KEY);
    if (stored === null) return false;
    return stored === "1";
  } catch {
    return false;
  }
}

export function writeYoutubeBgMutePreference(muted: boolean) {
  try {
    localStorage.setItem(MUTE_PREF_KEY, muted ? "1" : "0");
  } catch {
    // ignore
  }
}

type YoutubeBgPlayerApi = {
  isReady: boolean;
  isMuted: () => boolean;
  isPlaying: () => boolean;
  mute: () => void;
  unMute: () => void;
  play: () => void;
  pause: () => void;
};

export type YoutubeBgPlayerState = {
  active: boolean;
  ready: boolean;
  muted: boolean;
  playing: boolean;
};

type YoutubeBgPlayerListener = (state: YoutubeBgPlayerState) => void;

let youtubeBgPlayer: YoutubeBgPlayerApi | null = null;
let youtubeBgActive = false;
const youtubeBgPlayerListeners = new Set<YoutubeBgPlayerListener>();

function notifyYoutubeBgPlayerListeners() {
  const state = getYoutubeBgPlayerState();
  youtubeBgPlayerListeners.forEach((listener) => listener(state));
}

export function getYoutubeBgPlayerState(): YoutubeBgPlayerState {
  return {
    active: youtubeBgActive,
    ready: Boolean(youtubeBgPlayer?.isReady),
    muted: youtubeBgPlayer?.isReady
      ? youtubeBgPlayer.isMuted()
      : readYoutubeBgMutePreference(),
    playing: youtubeBgPlayer?.isReady ? youtubeBgPlayer.isPlaying() : false,
  };
}

/** @deprecated use getYoutubeBgPlayerState */
export function getYoutubeBgMuteState() {
  return getYoutubeBgPlayerState();
}

export function setYoutubeBgActive(active: boolean) {
  youtubeBgActive = active;
  if (!active) {
    youtubeBgPlayer = null;
  }
  notifyYoutubeBgPlayerListeners();
}

export function registerYoutubeBgPlayer(api: YoutubeBgPlayerApi | null) {
  youtubeBgPlayer = api;
  notifyYoutubeBgPlayerListeners();
}

export function publishYoutubeBgPlayerState() {
  notifyYoutubeBgPlayerListeners();
}

/** @deprecated use publishYoutubeBgPlayerState */
export function publishYoutubeBgMuteState() {
  publishYoutubeBgPlayerState();
}

export function toggleYoutubeBgMute(): boolean | null {
  if (!youtubeBgPlayer?.isReady) return null;
  const currentlyMuted = youtubeBgPlayer.isMuted();
  if (currentlyMuted) {
    youtubeBgPlayer.unMute();
    writeYoutubeBgMutePreference(false);
  } else {
    youtubeBgPlayer.mute();
    writeYoutubeBgMutePreference(true);
  }
  notifyYoutubeBgPlayerListeners();
  return !currentlyMuted ? true : false;
}

export function toggleYoutubeBgPlayback(): boolean | null {
  if (!youtubeBgPlayer?.isReady) return null;
  const currentlyPlaying = youtubeBgPlayer.isPlaying();
  if (currentlyPlaying) {
    youtubeBgPlayer.pause();
  } else {
    youtubeBgPlayer.play();
  }
  notifyYoutubeBgPlayerListeners();
  return !currentlyPlaying;
}

export function subscribeYoutubeBgPlayer(
  listener: YoutubeBgPlayerListener
): () => void {
  youtubeBgPlayerListeners.add(listener);
  listener(getYoutubeBgPlayerState());
  return () => {
    youtubeBgPlayerListeners.delete(listener);
  };
}

/** @deprecated use subscribeYoutubeBgPlayer */
export function subscribeYoutubeBgMute(
  listener: YoutubeBgPlayerListener
): () => void {
  return subscribeYoutubeBgPlayer(listener);
}
