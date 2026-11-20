"use client";

import Hls from "hls.js";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings2, PictureInPicture2,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { VideoWatermark } from "./watermark";
import { formatDuration } from "@/lib/money";
import type { PlaybackAuthorization } from "@/types";

interface WatermarkData {
  name: string;
  maskedEmail: string;
  studentId: string;
  opacity: number;
}

/**
 * Protected video player (master prompt §7):
 * - Obtains the source ONLY through /api/v1/playback/authorize (server checks
 *   session + enrollment, returns a short-lived signed src).
 * - No download button; download-attribute and context menu disabled as a
 *   deterrent (explicitly NOT treated as a security mechanism).
 * - Resumes from the server-saved position; saves progress automatically.
 */
export function ProtectedVideoPlayer({
  lessonId,
  resumeSeconds = 0,
  watermark,
  onProgress,
  onEnded,
}: {
  lessonId: string;
  resumeSeconds?: number;
  watermark: WatermarkData;
  onProgress?: (positionSeconds: number, watchPercent: number) => void;
  onEnded?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const lastSavedRef = useRef(0);
  const [auth, setAuth] = useState<PlaybackAuthorization | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [current, setCurrent] = useState(resumeSeconds);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [quality, setQuality] = useState("auto");
  const [showQuality, setShowQuality] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/v1/playback/authorize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lessonId,
            deviceId: getDeviceId(),
          }),
        });
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok || !json.ok) {
          setError(json.error?.message ?? "Playback authorization failed");
          return;
        }
        setAuth(json.data);
      } catch {
        if (!cancelled) setError("Could not authorize playback. Check your connection.");
      }
    })();
    return () => {
      cancelled = true;
      hlsRef.current?.destroy();
    };
  }, [lessonId]);

  // Attach source (HLS or MP4)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !auth) return;
    hlsRef.current?.destroy();
    hlsRef.current = null;

    if (auth.kind === "hls" && !video.canPlayType("application/vnd.apple.mpegurl")) {
      if (Hls.isSupported()) {
        const hls = new Hls({ xhrSetup: (xhr) => xhr.setRequestHeader("X-Playback-Token", auth.token) });
        hls.loadSource(auth.src);
        hls.attachMedia(video);
        hlsRef.current = hls;
      } else {
        setError("HLS playback is not supported in this browser.");
      }
    } else {
      video.src = auth.src;
    }
    const seek = () => {
      if (resumeSeconds > 0 && resumeSeconds < video.duration - 5) {
        video.currentTime = resumeSeconds;
      }
    };
    video.addEventListener("loadedmetadata", seek, { once: true });
    return () => video.removeEventListener("loadedmetadata", seek);
  }, [auth, resumeSeconds]);

  const saveProgress = useCallback(
    (positionSeconds: number, watchPercent: number, completed?: boolean) => {
      fetch("/api/v1/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, positionSeconds, watchPercent, completed }),
      }).catch(() => {});
    },
    [lessonId]
  );

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play();
    else video.pause();
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      void wrapperRef.current?.requestFullscreen();
      setFullscreen(true);
    } else {
      void document.exitFullscreen();
      setFullscreen(false);
    }
  }

  async function togglePiP() {
    const video = videoRef.current as (HTMLVideoElement & { requestPictureInPicture?: () => Promise<unknown> }) | null;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await video?.requestPictureInPicture?.();
    } catch {
      toast.error("Picture-in-picture is not available here.");
    }
  }

  function changeSpeed(s: number) {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = s;
    setSpeed(s);
  }

  function changeQuality(q: string) {
    setQuality(q);
    setShowQuality(false);
    if (hlsRef.current) {
      const levels = hlsRef.current.levels;
      if (q === "auto") hlsRef.current.currentLevel = -1;
      else {
        const idx = levels.findIndex((l) => `${l.height}p` === q);
        if (idx >= 0) hlsRef.current.currentLevel = idx;
      }
    }
  }

  const qualities = hlsRef.current?.levels?.length
    ? hlsRef.current.levels.map((l) => `${l.height}p`).filter((v, i, a) => a.indexOf(v) === i)
    : ["1080p", "720p"];

  return (
    <div
      ref={wrapperRef}
      className="relative aspect-video w-full overflow-hidden rounded-lg bg-black"
      onContextMenu={(e) => e.preventDefault()}
    >
      {auth && watermark ? (
        <VideoWatermark {...watermark} />
      ) : null}

      {error ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="text-sm font-medium text-slate-300">{error}</p>
        </div>
      ) : !auth ? (
        <div className="flex h-full items-center justify-center">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        </div>
      ) : (
        <video
          ref={videoRef}
          className="h-full w-full"
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
          controlsList="nodownload noplaybackrate"
          disablePictureInPicture={false}
          playsInline
          poster="/video-poster.svg"
          onClick={togglePlay}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={(e) => {
            const v = e.currentTarget;
            setCurrent(v.currentTime);
            const percent = v.duration ? (v.currentTime / v.duration) * 100 : 0;
            if (v.currentTime - lastSavedRef.current > 10) {
              lastSavedRef.current = v.currentTime;
              saveProgress(v.currentTime, percent);
              onProgress?.(v.currentTime, percent);
            }
          }}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
          onEnded={() => {
            saveProgress(duration, 100, true);
            onProgress?.(duration, 100);
            onEnded?.();
          }}
        />
      )}

      {auth && !error ? (
        <div className="absolute inset-x-0 bottom-0 z-30 flex items-center gap-2 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2.5 pt-8">
          <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/20 hover:text-white" onClick={togglePlay}>
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/20 hover:text-white" onClick={toggleMute}>
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <Slider
            value={[volume * 100]}
            max={100}
            className="w-20"
            onValueChange={(v) => {
              const vol = v[0] / 100;
              setVolume(vol);
              if (videoRef.current) {
                videoRef.current.volume = vol;
                videoRef.current.muted = vol === 0;
              }
            }}
          />
          <span className="ml-1 text-xs tabular-nums text-white/90">
            {formatDuration(current)} / {formatDuration(duration)}
          </span>
          <div className="relative ml-auto flex items-center gap-1">
            <span className="mr-1 rounded bg-white/10 px-1.5 py-0.5 text-xs font-medium text-white">{speed}x</span>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 gap-1 text-white hover:bg-white/20 hover:text-white"
              onClick={() => setShowQuality(!showQuality)}
            >
              <Settings2 className="h-4 w-4" /> {quality}
            </Button>
            {showQuality ? (
              <div className="absolute bottom-9 right-0 rounded-lg border border-slate-700 bg-slate-900/95 py-1 shadow-xl">
                {["auto", ...qualities].map((q) => (
                  <button
                    key={q}
                    className={`block w-full px-3 py-1.5 text-left text-xs hover:bg-slate-800 ${q === quality ? "text-[#8b95f6]" : "text-slate-200"}`}
                    onClick={() => changeQuality(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            ) : null}
            <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/20 hover:text-white" onClick={togglePiP}>
              <PictureInPicture2 className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/20 hover:text-white" onClick={toggleFullscreen}>
              {fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      ) : null}

      {/* Seekable timeline */}
      {auth && !error ? (
        <div className="absolute inset-x-0 bottom-[52px] z-30 px-3">
          <Slider
            value={[duration ? (current / duration) * 100 : 0]}
            max={100}
            onValueChange={(v) => {
              const video = videoRef.current;
              if (video && duration) video.currentTime = (v[0] / 100) * duration;
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem("bice_device_id");
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("bice_device_id", id);
  }
  return id;
}
