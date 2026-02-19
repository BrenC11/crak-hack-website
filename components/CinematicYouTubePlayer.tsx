"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type CinematicYouTubePlayerProps = {
  videoId: string;
  title: string;
  accentLabel?: string;
  playLabel?: string;
  className?: string;
};

type YouTubePlayer = {
  destroy: () => void;
  playVideo: () => void;
  pauseVideo: () => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  getCurrentTime: () => number;
  getDuration: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
};

type YouTubeApi = {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: () => void;
        onStateChange?: (event: { data: number }) => void;
      };
    }
  ) => YouTubePlayer;
};

declare global {
  interface Window {
    YT?: YouTubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<YouTubeApi> | null = null;

function loadYouTubeApi(): Promise<YouTubeApi> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("YouTube API is only available in the browser."));
  }

  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  if (youtubeApiPromise) {
    return youtubeApiPromise;
  }

  youtubeApiPromise = new Promise<YouTubeApi>((resolve) => {
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      if (window.YT) {
        resolve(window.YT);
      }
    };

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.youtube.com/iframe_api"]'
    );

    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.head.appendChild(script);
    }
  });

  return youtubeApiPromise;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "00:00";
  }

  const whole = Math.floor(seconds);
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const secs = whole % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function CinematicYouTubePlayer({
  videoId,
  title,
  accentLabel = "Transmission Feed",
  playLabel = "Play Film",
  className = ""
}: CinematicYouTubePlayerProps) {
  const playerHostRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const hideControlsTimerRef = useRef<number | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isInteracting, setIsInteracting] = useState(true);
  const [isSeeking, setIsSeeking] = useState(false);

  const progress = useMemo(() => {
    if (duration <= 0) {
      return 0;
    }
    return Math.min(100, (currentTime / duration) * 100);
  }, [currentTime, duration]);

  const showControls = !isPlaying || isInteracting || isSeeking;

  useEffect(() => {
    let isDisposed = false;

    const syncFromPlayer = () => {
      if (!playerRef.current) {
        return;
      }

      const nextCurrent = playerRef.current.getCurrentTime();
      const nextDuration = playerRef.current.getDuration();
      setCurrentTime(nextCurrent || 0);
      setDuration(nextDuration || 0);
      setIsMuted(playerRef.current.isMuted());
    };

    loadYouTubeApi()
      .then((YT) => {
        if (isDisposed || !playerHostRef.current) {
          return;
        }

        playerRef.current = new YT.Player(playerHostRef.current, {
          videoId,
          playerVars: {
            controls: 0,
            rel: 0,
            playsinline: 1,
            modestbranding: 1,
            iv_load_policy: 3
          },
          events: {
            onReady: () => {
              if (isDisposed) {
                return;
              }
              setIsReady(true);
              syncFromPlayer();
            },
            onStateChange: (event) => {
              if (isDisposed) {
                return;
              }
              setIsPlaying(event.data === 1);
              if (event.data === 0) {
                syncFromPlayer();
              }
            }
          }
        });
      })
      .catch(() => {
        setIsReady(false);
      });

    const timer = window.setInterval(() => {
      syncFromPlayer();
    }, 300);

    return () => {
      isDisposed = true;
      window.clearInterval(timer);
      if (hideControlsTimerRef.current) {
        window.clearTimeout(hideControlsTimerRef.current);
      }
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [videoId]);

  const clearHideTimer = () => {
    if (hideControlsTimerRef.current) {
      window.clearTimeout(hideControlsTimerRef.current);
      hideControlsTimerRef.current = null;
    }
  };

  const showControlsBriefly = () => {
    setIsInteracting(true);
    clearHideTimer();

    if (isPlaying && !isSeeking) {
      hideControlsTimerRef.current = window.setTimeout(() => {
        setIsInteracting(false);
      }, 1800);
    }
  };

  useEffect(() => {
    if (!isPlaying) {
      setIsInteracting(true);
      clearHideTimer();
      return;
    }
    showControlsBriefly();
  }, [isPlaying, isSeeking]);

  const togglePlay = () => {
    if (!playerRef.current || !isReady) {
      return;
    }
    if (isPlaying) {
      playerRef.current.pauseVideo();
      setIsPlaying(false);
      return;
    }
    playerRef.current.playVideo();
    setIsPlaying(true);
  };

  const toggleMute = () => {
    if (!playerRef.current || !isReady) {
      return;
    }
    if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
      return;
    }
    playerRef.current.mute();
    setIsMuted(true);
  };

  const handleSeek = (value: number) => {
    if (!playerRef.current || !isReady || duration <= 0) {
      return;
    }
    const seconds = (value / 100) * duration;
    playerRef.current.seekTo(seconds, true);
    setCurrentTime(seconds);
  };

  const toggleFullscreen = () => {
    if (!frameRef.current) {
      return;
    }
    if (!document.fullscreenElement) {
      void frameRef.current.requestFullscreen();
      return;
    }
    void document.exitFullscreen();
  };

  return (
    <div
      className={`relative w-full ${className}`}
      onMouseMove={showControlsBriefly}
      onMouseEnter={showControlsBriefly}
      onMouseLeave={() => {
        if (isPlaying && !isSeeking) {
          setIsInteracting(false);
        }
      }}
      onTouchStart={showControlsBriefly}
      onFocusCapture={showControlsBriefly}
    >
      <div className="pointer-events-none absolute inset-0 z-20 rounded-xl bg-gradient-to-t from-black/70 via-transparent to-black/30" />
      <div
        className={`pointer-events-none absolute inset-x-6 top-5 z-30 flex items-center justify-between text-[10px] uppercase tracking-[0.24em] text-ice/70 transition duration-300 ${
          isPlaying ? "opacity-0" : "opacity-100"
        }`}
      >
        <span className="rounded-full border border-hud/40 bg-black/40 px-3 py-1">{accentLabel}</span>
        <span className="flex items-center gap-2 rounded-full border border-hud/40 bg-black/40 px-3 py-1">
          <span className={`h-1.5 w-1.5 rounded-full ${isPlaying ? "bg-hack shadow-hackGlow" : "bg-ice/40"}`} />
          {isPlaying ? "Live Playback" : "Standby"}
        </span>
      </div>

      <div ref={frameRef} className="relative aspect-video overflow-hidden rounded-xl bg-black shadow-glow">
        <div ref={playerHostRef} className="absolute inset-0 h-full w-full" aria-label={title} />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_96%,rgba(167,247,239,0.08)_100%)] bg-[length:100%_4px]" />
        <button
          type="button"
          onClick={togglePlay}
          className={`absolute left-1/2 top-1/2 z-30 flex -translate-x-1/2 -translate-y-1/2 items-center gap-3 rounded-full border border-hud/60 bg-black/65 px-5 py-3 text-xs uppercase tracking-[0.22em] text-ice shadow-glow transition duration-300 ${
            isPlaying
              ? "pointer-events-none scale-90 opacity-0"
              : "scale-100 opacity-100 hover:border-hud hover:bg-black/80"
          }`}
          aria-label="Play video"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-hud/60 bg-hack/20 text-hack">
            ▶
          </span>
          {playLabel}
        </button>
      </div>

      <div
        className={`absolute inset-x-4 bottom-4 z-30 rounded-lg border border-hud/30 bg-black/70 px-4 py-3 backdrop-blur transition duration-300 ${
          showControls ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.24em] text-ice/65">
          <span>{title}</span>
          <span>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={100}
          value={progress}
          onChange={(event) => {
            handleSeek(Number(event.target.value));
          }}
          onMouseDown={() => {
            setIsSeeking(true);
            setIsInteracting(true);
          }}
          onMouseUp={() => {
            setIsSeeking(false);
            showControlsBriefly();
          }}
          onTouchStart={() => {
            setIsSeeking(true);
            setIsInteracting(true);
          }}
          onTouchEnd={() => {
            setIsSeeking(false);
            showControlsBriefly();
          }}
          onFocus={showControlsBriefly}
          onBlur={() => {
            setIsSeeking(false);
          }}
          className="mb-3 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-hack"
          aria-label={`${title} timeline`}
        />

        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-ice/80">
          <button
            type="button"
            onClick={togglePlay}
            className="rounded-md border border-hud/40 bg-black/50 px-3 py-1.5 transition hover:border-hud/70 hover:text-ice"
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button
            type="button"
            onClick={toggleMute}
            className="rounded-md border border-hud/40 bg-black/50 px-3 py-1.5 transition hover:border-hud/70 hover:text-ice"
          >
            {isMuted ? "Unmute" : "Mute"}
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="rounded-md border border-hud/40 bg-black/50 px-3 py-1.5 transition hover:border-hud/70 hover:text-ice"
          >
            Fullscreen
          </button>
          <a
            href={`https://youtu.be/${videoId}`}
            target="_blank"
            rel="noreferrer"
            className="ml-auto rounded-md border border-hud/40 bg-black/50 px-3 py-1.5 transition hover:border-hud/70 hover:text-ice"
          >
            YouTube
          </a>
        </div>
      </div>
    </div>
  );
}
