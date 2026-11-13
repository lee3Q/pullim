"use client";

import { useRef, useState, useCallback, useEffect } from "react";

const DEFAULT_TRACKS = [
  { src: "/assets/campfire-bgm.mp3", label: "모닥불 1" },
  { src: "/assets/campfire-bgm-2.mp3", label: "모닥불 2" },
];

export function useBGM(tracks?: { src: string; label: string }[]) {
  const activeTracks = tracks && tracks.length > 0 ? tracks : DEFAULT_TRACKS;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [trackIndex, setTrackIndex] = useState(0);
  const started = useRef(false);

  const createAudio = useCallback((src: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = 0.25;
    audio.preload = "none";
    audioRef.current = audio;
    return audio;
  }, []);

  useEffect(() => {
    createAudio(activeTracks[trackIndex % activeTracks.length].src);
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, [trackIndex, createAudio, activeTracks]);

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.play().then(() => setPlaying(true)).catch(() => {});
  }, []);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => {});
    }
  }, [playing]);

  const nextTrack = useCallback(() => {
    const wasPlaying = playing;
    const next = (trackIndex + 1) % activeTracks.length;
    setTrackIndex(next);
    // 다음 렌더에서 새 Audio 생성 후 재생
    setTimeout(() => {
      if (wasPlaying) {
        audioRef.current?.play().then(() => setPlaying(true)).catch(() => {});
      }
    }, 100);
  }, [trackIndex, playing, activeTracks.length]);

  // 첫 유저 인터랙션에서 자동 재생
  useEffect(() => {
    const handleInteraction = () => {
      if (started.current) return;
      started.current = true;
      play();
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("touchstart", handleInteraction);
    };

    document.addEventListener("click", handleInteraction);
    document.addEventListener("touchstart", handleInteraction);

    return () => {
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("touchstart", handleInteraction);
    };
  }, [play]);

  return {
    playing,
    trackLabel: activeTracks[trackIndex % activeTracks.length].label,
    toggle,
    nextTrack,
  };
}
