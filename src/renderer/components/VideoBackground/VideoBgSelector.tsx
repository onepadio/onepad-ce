import React, { useState } from "react";
import { Button } from "reactstrap";

import {
  YOUTUBE_BG_PRESETS,
  YOUTUBE_PLAYLIST_PRESETS,
  addCustomYoutubePlaylist,
  addCustomYoutubeVideo,
  encodeYoutubeBackground,
  encodeYoutubeBgSource,
  parseYoutubeInput,
  playlistThumbnailUrl,
  readCustomYoutubePlaylists,
  readCustomYoutubeVideos,
  removeCustomYoutubePlaylist,
  removeCustomYoutubeVideo,
  youtubeThumbnailUrl,
  type CustomYoutubePlaylist,
  type CustomYoutubeVideo,
} from "../../services/youtubeBackground";

import "../BgSelectorDropDown/BgSelectorDropDown.css";

const VIDEO_CATEGORIES = ["Videos", "Playlists"] as const;

function VideoBgSelector({
  onSelect,
}: {
  onSelect: (encodedSource: string) => void;
}) {
  const [videoCategory, setVideoCategory] = useState<"Videos" | "Playlists">(
    "Videos"
  );
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [itemTitle, setItemTitle] = useState("");
  const [youtubeError, setYoutubeError] = useState<string | null>(null);
  const [customPlaylists, setCustomPlaylists] = useState<CustomYoutubePlaylist[]>(
    () => readCustomYoutubePlaylists()
  );
  const [customVideos, setCustomVideos] = useState<CustomYoutubeVideo[]>(() =>
    readCustomYoutubeVideos()
  );

  const showPlaylists = videoCategory === "Playlists";

  function applyYoutubeVideo(videoId: string, start = 0) {
    if (!videoId) return;
    setYoutubeError(null);
    onSelect(encodeYoutubeBackground(videoId, start));
  }

  function applyPlaylist(playlistId: string) {
    if (!playlistId) return;
    setYoutubeError(null);
    onSelect(encodeYoutubeBgSource({ type: "playlist", playlistId }));
  }

  function applyVideosMix(videoIds: string[]) {
    if (!videoIds.length) return;
    setYoutubeError(null);
    onSelect(encodeYoutubeBgSource({ type: "videos", videoIds }));
  }

  /** Add to library only — instant play lives in the chrome URL field. */
  function handleAddToLibrary() {
    const parsed = parseYoutubeInput(youtubeUrl);
    if (!parsed) {
      setYoutubeError(
        videoCategory === "Playlists"
          ? "Paste a valid YouTube playlist URL or playlist ID"
          : "Paste a valid YouTube URL or video ID"
      );
      return;
    }

    if (videoCategory === "Playlists") {
      if (parsed.type !== "playlist") {
        setYoutubeError(
          "That looks like a single video. Switch to Videos, or paste a playlist URL."
        );
        return;
      }
      const title =
        itemTitle.trim() || `Playlist ${parsed.playlistId.slice(0, 8)}…`;
      setCustomPlaylists(
        addCustomYoutubePlaylist({
          id: parsed.playlistId,
          title,
          thumbnailVideoId: parsed.videoId,
        })
      );
      setItemTitle("");
      setYoutubeUrl("");
      setYoutubeError(null);
      return;
    }

    if (parsed.type === "playlist") {
      setYoutubeError(
        "That’s a playlist URL. Switch to Playlists to save it."
      );
      return;
    }

    const title = itemTitle.trim() || `Video ${parsed.videoId}`;
    setCustomVideos(
      addCustomYoutubeVideo({
        id: parsed.videoId,
        title,
      })
    );
    setItemTitle("");
    setYoutubeUrl("");
    setYoutubeError(null);
  }

  function handleRemoveCustomPlaylist(
    event: React.MouseEvent,
    playlistId: string
  ) {
    event.stopPropagation();
    setCustomPlaylists(removeCustomYoutubePlaylist(playlistId));
  }

  function handleRemoveCustomVideo(event: React.MouseEvent, videoId: string) {
    event.stopPropagation();
    setCustomVideos(removeCustomYoutubeVideo(videoId));
  }

  return (
    <div className="bg-selector-container">
      <div className="categories-nav">
        {VIDEO_CATEGORIES.map((category) => (
          <div
            key={category}
            className={`category-item ${
              category === videoCategory ? "active" : ""
            }`}
            onClick={() => {
              setVideoCategory(category);
              setYoutubeError(null);
              setItemTitle("");
            }}
          >
            {category}
          </div>
        ))}
      </div>

      <div className="bg-selector-grid-container">
        <div className="playlist-add-fields">
          <div className="query-field-container d-flex justify-content-center align-items-center">
            <input
              type="text"
              value={youtubeUrl}
              onChange={(e) => {
                setYoutubeUrl(e.target.value);
                setYoutubeError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddToLibrary();
                }
              }}
              className="mr-2"
              placeholder={
                showPlaylists
                  ? "Paste YouTube playlist URL to add…"
                  : "Paste YouTube video URL to add…"
              }
            />
          </div>
          <div className="query-field-container d-flex justify-content-center align-items-center">
            <input
              type="text"
              value={itemTitle}
              onChange={(e) => setItemTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddToLibrary();
                }
              }}
              className="mr-2"
              placeholder="Optional title"
            />
            <Button
              color="primary"
              size="sm"
              type="button"
              onClick={handleAddToLibrary}
            >
              Add
            </Button>
          </div>
        </div>

        <div className="bg-selector-grid">
          {youtubeError && (
            <div
              className="d-flex flex-fluid justify-content-center"
              style={{ gridColumn: "1 / -1" }}
            >
              <span className="ml-2" style={{ color: "#ff6b6b" }}>
                {youtubeError}
              </span>
            </div>
          )}

          {!showPlaylists &&
            YOUTUBE_BG_PRESETS.map((preset) => (
              <div
                key={preset.id}
                className="bg-selector-grid-item"
                onClick={() => applyYoutubeVideo(preset.id, preset.start || 0)}
                title={preset.title}
              >
                <img
                  className="bg-selector-grid-image"
                  src={youtubeThumbnailUrl(preset.id)}
                  alt={preset.title}
                  loading="lazy"
                />
                <span className="bg-selector-youtube-label">{preset.title}</span>
              </div>
            ))}

          {!showPlaylists &&
            customVideos.map((video) => (
              <div
                key={video.id}
                className="bg-selector-grid-item"
                onClick={() => applyYoutubeVideo(video.id, video.start || 0)}
                title={video.title}
              >
                <img
                  className="bg-selector-grid-image"
                  src={youtubeThumbnailUrl(video.id)}
                  alt={video.title}
                  loading="lazy"
                />
                <span className="bg-selector-playlist-badge">Saved</span>
                <button
                  type="button"
                  className="bg-selector-playlist-remove"
                  aria-label={`Remove ${video.title}`}
                  onClick={(e) => handleRemoveCustomVideo(e, video.id)}
                >
                  ×
                </button>
                <span className="bg-selector-youtube-label">{video.title}</span>
              </div>
            ))}

          {showPlaylists &&
            YOUTUBE_PLAYLIST_PRESETS.map((preset) => {
              const thumb = playlistThumbnailUrl(preset);
              return (
                <div
                  key={preset.id}
                  className="bg-selector-grid-item"
                  onClick={() => {
                    if (preset.type === "videos") {
                      applyVideosMix(preset.videoIds);
                    } else {
                      applyPlaylist(preset.id);
                    }
                  }}
                  title={preset.title}
                >
                  {thumb ? (
                    <img
                      className="bg-selector-grid-image"
                      src={thumb}
                      alt={preset.title}
                      loading="lazy"
                    />
                  ) : (
                    <div className="bg-selector-playlist-placeholder" />
                  )}
                  <span className="bg-selector-playlist-badge">Playlist</span>
                  <span className="bg-selector-youtube-label">{preset.title}</span>
                </div>
              );
            })}

          {showPlaylists &&
            customPlaylists.map((playlist) => {
              const thumb = playlist.thumbnailVideoId
                ? youtubeThumbnailUrl(playlist.thumbnailVideoId)
                : null;
              return (
                <div
                  key={playlist.id}
                  className="bg-selector-grid-item"
                  onClick={() => applyPlaylist(playlist.id)}
                  title={playlist.title}
                >
                  {thumb ? (
                    <img
                      className="bg-selector-grid-image"
                      src={thumb}
                      alt={playlist.title}
                      loading="lazy"
                    />
                  ) : (
                    <div className="bg-selector-playlist-placeholder" />
                  )}
                  <span className="bg-selector-playlist-badge">Saved</span>
                  <button
                    type="button"
                    className="bg-selector-playlist-remove"
                    aria-label={`Remove ${playlist.title}`}
                    onClick={(e) => handleRemoveCustomPlaylist(e, playlist.id)}
                  >
                    ×
                  </button>
                  <span className="bg-selector-youtube-label">
                    {playlist.title}
                  </span>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

export default VideoBgSelector;
