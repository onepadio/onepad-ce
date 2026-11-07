import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import log from "loglevel";
import "./VideoBackground.css";
import {
  YOUTUBE_BG_HOME_URL,
  YOUTUBE_BG_PARTITION,
  isYoutubeHost,
  isYoutubeMusicSource,
  publishYoutubeBgPlayerState,
  readYoutubeBgMutePreference,
  registerYoutubeBgPlayer,
  setYoutubeBgActive,
  writeYoutubeBgMutePreference,
  youtubeSourceToBrowseUrl,
} from "../../services/youtubeBackground";
import { appActions } from "../../store/app-slice";

const MEDIA_SCRIPT = `
(() => {
  const v = document.querySelector('video');
  if (!v) return null;
  return {
    muted: !!v.muted,
    paused: !!v.paused,
    volume: v.volume,
  };
})();
`;

function runMediaCommand(webview: any, command: "mute" | "unmute" | "play" | "pause") {
  const script =
    command === "mute"
      ? `(() => { const v = document.querySelector('video'); if (v) { v.muted = true; } return true; })()`
      : command === "unmute"
        ? `(() => { const v = document.querySelector('video'); if (v) { v.muted = false; v.volume = 1; } return true; })()`
        : command === "play"
          ? `(() => { const v = document.querySelector('video'); if (v) { v.play(); } return true; })()`
          : `(() => { const v = document.querySelector('video'); if (v) { v.pause(); } return true; })()`;
  try {
    webview.executeJavaScript(script, true);
  } catch (error) {
    log.debug("YouTube bg media command failed", command, error);
  }
}

function normalizeBrowseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Drop trailing slash on pathname root for stable compares
    if (parsed.pathname === "/") {
      return `${parsed.origin}/`;
    }
    return parsed.href;
  } catch {
    return url;
  }
}

const VideoBackground = ({
  source,
}: {
  source: string;
}) => {
  const dispatch = useDispatch();
  const interactiveWanted = useSelector(
    (state: any) => state.app.videoBgInteractive
  );
  const isBgPickerOpen = useSelector(
    (state: any) =>
      state.modal.isChangeVideoBackgroundModalOpen ||
      state.modal.isChangeBackgroundModalOpen
  );
  // Stay under #wrapper (z-index 5) while pickers are open — interactive uses 90
  const interactive = interactiveWanted && !isBgPickerOpen;
  const webviewRef = useRef<any>(null);
  const wantMutedRef = useRef(readYoutubeBgMutePreference());
  const lastRequestedUrlRef = useRef("");
  const browseUrl = normalizeBrowseUrl(
    youtubeSourceToBrowseUrl(source) || YOUTUBE_BG_HOME_URL
  );
  // Remount when switching Music ↔ YouTube — Electron webview often ignores src updates
  const webviewKey = isYoutubeMusicSource(browseUrl) ? "music" : "youtube";

  useEffect(() => {
    setYoutubeBgActive(true);
    return () => {
      setYoutubeBgActive(false);
      registerYoutubeBgPlayer(null);
    };
  }, []);

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    let cancelled = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const syncApi = () => {
      if (cancelled || !webviewRef.current) return;
      registerYoutubeBgPlayer({
        isReady: true,
        isMuted: () => wantMutedRef.current,
        isPlaying: () => true,
        mute: () => {
          wantMutedRef.current = true;
          writeYoutubeBgMutePreference(true);
          runMediaCommand(webviewRef.current, "mute");
          publishYoutubeBgPlayerState();
        },
        unMute: () => {
          wantMutedRef.current = false;
          writeYoutubeBgMutePreference(false);
          runMediaCommand(webviewRef.current, "unmute");
          publishYoutubeBgPlayerState();
        },
        play: () => {
          runMediaCommand(webviewRef.current, "play");
          publishYoutubeBgPlayerState();
        },
        pause: () => {
          runMediaCommand(webviewRef.current, "pause");
          publishYoutubeBgPlayerState();
        },
      });
    };

    const refreshPlaybackState = () => {
      const wv = webviewRef.current;
      if (!wv?.executeJavaScript) return;
      wv
        .executeJavaScript(MEDIA_SCRIPT, true)
        .then((info: any) => {
          if (!info || cancelled) return;
          if (typeof info.muted === "boolean") {
            wantMutedRef.current = info.muted;
          }
          registerYoutubeBgPlayer({
            isReady: true,
            isMuted: () => wantMutedRef.current,
            isPlaying: () => info && info.paused === false,
            mute: () => {
              wantMutedRef.current = true;
              writeYoutubeBgMutePreference(true);
              runMediaCommand(webviewRef.current, "mute");
              publishYoutubeBgPlayerState();
            },
            unMute: () => {
              wantMutedRef.current = false;
              writeYoutubeBgMutePreference(false);
              runMediaCommand(webviewRef.current, "unmute");
              publishYoutubeBgPlayerState();
            },
            play: () => {
              runMediaCommand(webviewRef.current, "play");
              publishYoutubeBgPlayerState();
            },
            pause: () => {
              runMediaCommand(webviewRef.current, "pause");
              publishYoutubeBgPlayerState();
            },
          });
        })
        .catch(() => {
          // page may not have a video element yet
        });
    };

    const onDomReady = () => {
      log.debug("YouTube bg webview ready", browseUrl);
      syncApi();
      if (wantMutedRef.current) {
        runMediaCommand(webview, "mute");
      }
      refreshPlaybackState();
    };

    const onNavigate = (event: any) => {
      const url = event?.url || webview.getURL?.();
      if (!url) return;
      try {
        if (!isYoutubeHost(new URL(url).hostname)) {
          event.preventDefault?.();
          return;
        }
      } catch {
        return;
      }
      lastRequestedUrlRef.current = normalizeBrowseUrl(url);
      // Persist last browsed YouTube URL so resume works across space switches
      dispatch(appActions.setVideoBgSource({ source: url }));
    };

    const onWillNavigate = (event: any) => {
      try {
        if (!isYoutubeHost(new URL(event.url).hostname)) {
          event.preventDefault();
        }
      } catch {
        event.preventDefault();
      }
    };

    const onNewWindow = (event: any) => {
      const url = event.url;
      try {
        if (isYoutubeHost(new URL(url).hostname)) {
          webview.loadURL(url);
        }
      } catch {
        // ignore
      }
    };

    webview.addEventListener("dom-ready", onDomReady);
    webview.addEventListener("did-navigate", onNavigate);
    webview.addEventListener("did-navigate-in-page", onNavigate);
    webview.addEventListener("will-navigate", onWillNavigate);
    webview.addEventListener("new-window", onNewWindow);

    pollTimer = setInterval(refreshPlaybackState, 2000);
    syncApi();

    return () => {
      cancelled = true;
      if (pollTimer) clearInterval(pollTimer);
      webview.removeEventListener("dom-ready", onDomReady);
      webview.removeEventListener("did-navigate", onNavigate);
      webview.removeEventListener("did-navigate-in-page", onNavigate);
      webview.removeEventListener("will-navigate", onWillNavigate);
      webview.removeEventListener("new-window", onNewWindow);
      registerYoutubeBgPlayer(null);
    };
  }, [dispatch, browseUrl, webviewKey]);

  // Navigate when the target URL changes (Electron often ignores src attribute updates)
  useEffect(() => {
    // Fresh instance after Music ↔ YouTube remount — src handles the first load
    lastRequestedUrlRef.current = "";
  }, [webviewKey]);

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview || !browseUrl) return;

    const current = (() => {
      try {
        return normalizeBrowseUrl(webview.getURL?.() || "");
      } catch {
        return "";
      }
    })();

    if (current && current !== "about:blank" && current === browseUrl) {
      lastRequestedUrlRef.current = browseUrl;
      return;
    }

    if (lastRequestedUrlRef.current === browseUrl) {
      return;
    }

    lastRequestedUrlRef.current = browseUrl;
    try {
      if (typeof webview.loadURL === "function") {
        log.debug("YouTube bg loadURL", browseUrl);
        webview.loadURL(browseUrl);
      }
    } catch (error) {
      log.debug("YouTube bg loadURL failed", error);
    }
  }, [browseUrl, webviewKey]);

  return (
    <div
      className={`video-background ${interactive ? "video-background-interactive" : ""}`}
    >
      {/* @ts-expect-error Electron webview element */}
      <webview
        key={webviewKey}
        ref={webviewRef}
        className="video-background-webview"
        src={browseUrl}
        partition={YOUTUBE_BG_PARTITION}
        allowpopups={false}
        webpreferences="contextIsolation=yes, nativeWindowOpen=no"
      />
      {interactive && (
        <div className="video-background-browse-hint">
          Browsing YouTube — click Done in the top controls when finished
        </div>
      )}
    </div>
  );
};

export default VideoBackground;
