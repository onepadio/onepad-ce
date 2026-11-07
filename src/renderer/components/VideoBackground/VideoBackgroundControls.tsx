import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Cursor,
  PauseFill,
  PlayFill,
  PlayCircleFill,
  StopFill,
  VolumeMuteFill,
  VolumeUpFill,
} from "react-bootstrap-icons";
import {
  getYoutubeBgPlayerState,
  isYoutubeBackground,
  isYoutubeMusicSource,
  subscribeYoutubeBgPlayer,
  toggleYoutubeBgMute,
  toggleYoutubeBgPlayback,
} from "../../services/youtubeBackground";
import { appActions } from "../../store/app-slice";
import "./VideoBackground.css";

function VideoBackgroundControls() {
  const dispatch = useDispatch();
  const interactive = useSelector((state: any) => state.app.videoBgInteractive);
  const videoBgSource = useSelector((state: any) => state.app.videoBgSource);
  const isMusic = isYoutubeMusicSource(videoBgSource);
  const [state, setState] = useState(getYoutubeBgPlayerState);
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => subscribeYoutubeBgPlayer(setState), []);

  function playFromUrl() {
    const trimmed = url.trim();
    if (!isYoutubeBackground(trimmed) && !/^[\w-]{11}$/.test(trimmed)) {
      // allow bare video ids via encoded form below
      setUrlError("Paste a YouTube URL");
      return;
    }

    let source = trimmed;
    if (/^[\w-]{11}$/.test(trimmed)) {
      source = `youtube:${trimmed}`;
    } else if (!/^https?:\/\//i.test(trimmed)) {
      setUrlError("Paste a YouTube URL");
      return;
    } else if (!isYoutubeBackground(trimmed)) {
      setUrlError("Paste a YouTube URL");
      return;
    }

    setUrlError(null);
    dispatch(appActions.enableVideoBg({ source }));
    setUrl("");
  }

  if (!state.active) return null;

  return (
    <div className="video-bg-controls">
      {!isMusic && (
        <>
          <form
            className="video-bg-url-form"
            onSubmit={(e) => {
              e.preventDefault();
              playFromUrl();
            }}
          >
            <input
              type="text"
              className="video-bg-url-input"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setUrlError(null);
              }}
              placeholder="Paste YouTube URL…"
              aria-label="YouTube URL"
              title={urlError || "Paste a YouTube URL and press Enter to open"}
            />
            <button
              type="submit"
              className="chat-assistant-button video-bg-control-button"
              disabled={!url.trim()}
              aria-label="Open YouTube URL"
              title="Open"
            >
              <PlayCircleFill size={16} />
            </button>
          </form>
          {urlError && <span className="video-bg-url-error">{urlError}</span>}
        </>
      )}
      <button
        type="button"
        className={`chat-assistant-button video-bg-control-button ${
          interactive ? "video-bg-control-button-active" : ""
        }`}
        onClick={() =>
          dispatch(
            appActions.setVideoBgInteractive({ interactive: !interactive })
          )
        }
        aria-label={interactive ? "Done browsing YouTube" : "Browse YouTube"}
        title={interactive ? "Done browsing" : "Browse / interact with YouTube"}
      >
        <Cursor size={16} />
      </button>
      <button
        type="button"
        className="chat-assistant-button video-bg-control-button"
        onClick={() => toggleYoutubeBgPlayback()}
        disabled={!state.ready}
        aria-label={state.playing ? "Pause background video" : "Play background video"}
        title={state.playing ? "Pause" : "Play"}
      >
        {state.playing ? <PauseFill size={16} /> : <PlayFill size={16} />}
      </button>
      <button
        type="button"
        className="chat-assistant-button video-bg-control-button"
        onClick={() => {
          dispatch(appActions.setVideoBgInteractive({ interactive: false }));
          dispatch(appActions.disableVideoBg());
        }}
        aria-label="Turn off background video"
        title="Turn off video"
      >
        <StopFill size={16} />
      </button>
      <button
        type="button"
        className="chat-assistant-button video-bg-control-button"
        onClick={() => toggleYoutubeBgMute()}
        disabled={!state.ready}
        aria-label={state.muted ? "Unmute background video" : "Mute background video"}
        title={state.muted ? "Unmute" : "Mute"}
      >
        {state.muted ? <VolumeMuteFill size={16} /> : <VolumeUpFill size={16} />}
      </button>
    </div>
  );
}

export default VideoBackgroundControls;
