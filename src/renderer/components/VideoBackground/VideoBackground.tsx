import React, { useEffect, useRef, useState } from 'react';
import './VideoBackground.css';
import log from 'loglevel';
const VideoBackground = ({
  onToggleMute
}: any) => {
  const playerRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    // Load YouTube API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    // Initialize player when API is ready
    // @ts-expect-error
    window.onYouTubeIframeAPIReady = () => {
      // @ts-expect-error
      playerRef.current = new window.YT.Player('video-player', {
        events: {
          onReady: (event: any) => {
            // Player is ready
            log.debug('Player ready');
          }
        }
      });
    };
  }, []);

  const toggleMute = () => {
    if (playerRef.current) {
      if (playerRef.current.isMuted()) {
        playerRef.current.unMute();
        setIsMuted(false);
        onToggleMute?.(false);
      } else {
        playerRef.current.mute();
        setIsMuted(true);
        onToggleMute?.(true);
      }
    }
  };

  return (
    <div className="video-background">
      <iframe 
        id="video-player"
        className="pointer-events-none absolute left-1/2 top-1/2 box-border h-[56.25vw] min-h-full w-screen min-w-full -translate-x-1/2 -translate-y-1/2"
        src="https://www.youtube.com/embed/CfPxlb8-ZQ0?start=60&loop=1&playlist=CfPxlb8-ZQ0&showinfo=0&controls=0&disablekb=0&fs=0&rel=0&iv_load_policy=3&autoplay=1&mute=0&modestbranding=1&playsinline=1&enablejsapi=1"
        title="Work & Study Lofi Jazz"
        width="100%"
        height="100%"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
      <button 
        className="absolute top-9 left-4 z-10 bg-white/20 hover:bg-white/30 rounded-full p-2 volume-button"
        onClick={toggleMute}
      >
        {isMuted ? '🔇' : '🔊'}
      </button>
    </div>
  );
};

export default VideoBackground;
