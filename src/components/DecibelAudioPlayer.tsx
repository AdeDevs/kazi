import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Play, Pause } from 'lucide-react';

interface DecibelAudioPlayerProps {
  mediaUrl?: string;
  duration?: number;
  isCustomer?: boolean;
  msgId: string;
  activePlayingId: string | null;
  onPlayStateChange: (msgId: string | null) => void;
}

/**
 * Deterministically generates realistic WhatsApp/Instagram-style decibel waveform amplitude bars
 */
function generateWaveformBars(seed: string, count: number = 32): number[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }

  const bars: number[] = [];
  for (let i = 0; i < count; i++) {
    const norm = i / count;
    // Acoustic human voice envelope pattern (moderate start, natural cadences, soft tail)
    const envelope = Math.sin(norm * Math.PI);
    const pseudoRand = Math.abs(Math.sin((hash + i * 23.7) * 1.618));
    const rawHeight = envelope * (pseudoRand * 18 + 8) + 4;
    bars.push(Math.max(4, Math.min(26, Math.round(rawHeight))));
  }
  return bars;
}

export const DecibelAudioPlayer: React.FC<DecibelAudioPlayerProps> = ({
  mediaUrl,
  duration = 5,
  isCustomer = false,
  msgId,
  activePlayingId,
  onPlayStateChange
}) => {
  const isPlaying = activePlayingId === msgId;
  const [currentProgress, setCurrentProgress] = useState<number>(0); // 0.0 to 1.0
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 1.5 | 2>(1);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [hoverPosition, setHoverPosition] = useState<{ fraction: number; x: number } | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(duration || 5);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const waveformTrackRef = useRef<HTMLDivElement | null>(null);
  const startProgressRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);

  // Generate stable waveform
  const bars = useMemo(() => generateWaveformBars(msgId + (mediaUrl || ''), 32), [msgId, mediaUrl]);

  // Clean up RAF and audio elements
  const stopPlayback = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  useEffect(() => {
    return () => {
      stopPlayback();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [stopPlayback]);

  // Pause if another audio in chat starts playing
  useEffect(() => {
    if (!isPlaying) {
      stopPlayback();
    }
  }, [isPlaying, stopPlayback]);

  // Sync playback speed to real audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // 60FPS RAF continuous smooth playhead runner for real Audio objects
  const runAudioRaf = useCallback(() => {
    const update = () => {
      const audio = audioRef.current;
      if (audio && !audio.paused && audio.duration && !isNaN(audio.duration)) {
        const prog = audio.currentTime / audio.duration;
        if (!isDraggingRef.current) {
          setCurrentProgress(Math.min(1, Math.max(0, prog)));
        }
        animFrameRef.current = requestAnimationFrame(update);
      }
    };
    animFrameRef.current = requestAnimationFrame(update);
  }, []);

  // 60FPS RAF Synthetic simulation for seed / mock voicenotes
  const runSyntheticRaf = useCallback(() => {
    const totalMs = (audioDuration / playbackSpeed) * 1000;
    const startMs = performance.now();
    const initialProg = startProgressRef.current;

    const updateSynthetic = (now: number) => {
      if (isDraggingRef.current) {
        animFrameRef.current = requestAnimationFrame(updateSynthetic);
        return;
      }
      const elapsed = now - startMs;
      const prog = Math.min(1, initialProg + (elapsed / totalMs));
      setCurrentProgress(prog);

      if (prog >= 1) {
        setCurrentProgress(0);
        startProgressRef.current = 0;
        onPlayStateChange(null);
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
          animFrameRef.current = null;
        }
      } else {
        animFrameRef.current = requestAnimationFrame(updateSynthetic);
      }
    };

    animFrameRef.current = requestAnimationFrame(updateSynthetic);
  }, [audioDuration, playbackSpeed, onPlayStateChange]);

  const togglePlay = () => {
    if (isPlaying) {
      onPlayStateChange(null);
      stopPlayback();
      startProgressRef.current = currentProgress;
      return;
    }

    onPlayStateChange(msgId);
    const hasRealAudio = mediaUrl && (mediaUrl.startsWith('data:audio') || mediaUrl.startsWith('blob:') || mediaUrl.startsWith('http'));

    if (hasRealAudio) {
      if (!audioRef.current) {
        const audio = new Audio(mediaUrl);
        audioRef.current = audio;
        audio.playbackRate = playbackSpeed;

        audio.onloadedmetadata = () => {
          if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
            setAudioDuration(audio.duration);
          }
        };

        audio.onended = () => {
          onPlayStateChange(null);
          setCurrentProgress(0);
          startProgressRef.current = 0;
          stopPlayback();
        };

        audio.onerror = () => {
          onPlayStateChange(null);
          stopPlayback();
        };
      }

      const audio = audioRef.current;
      audio.playbackRate = playbackSpeed;
      if (currentProgress >= 0.99) {
        audio.currentTime = 0;
        setCurrentProgress(0);
      } else if (audio.duration) {
        audio.currentTime = currentProgress * audio.duration;
      }

      audio.play().then(() => {
        runAudioRaf();
      }).catch(() => {
        onPlayStateChange(null);
      });

    } else {
      // Mock playback simulation
      if (currentProgress >= 0.99) {
        setCurrentProgress(0);
        startProgressRef.current = 0;
      } else {
        startProgressRef.current = currentProgress;
      }
      runSyntheticRaf();
    }
  };

  // Speed toggle (1x -> 1.5x -> 2x)
  const handleSpeedToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPlaybackSpeed(prev => (prev === 1 ? 1.5 : prev === 1.5 ? 2 : 1));
  };

  // Scrubbing & Magnetic Seeking calculations
  const calculateProgressFromClientX = (clientX: number): number => {
    if (!waveformTrackRef.current) return 0;
    const rect = waveformTrackRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    return Math.max(0, Math.min(1, x / rect.width));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    isDraggingRef.current = true;

    const prog = calculateProgressFromClientX(e.clientX);
    setCurrentProgress(prog);
    startProgressRef.current = prog;

    if (audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = prog * audioRef.current.duration;
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const fraction = calculateProgressFromClientX(e.clientX);
    if (waveformTrackRef.current) {
      const rect = waveformTrackRef.current.getBoundingClientRect();
      setHoverPosition({ fraction, x: e.clientX - rect.left });
    }

    if (isDraggingRef.current) {
      setCurrentProgress(fraction);
      startProgressRef.current = fraction;

      if (audioRef.current && audioRef.current.duration) {
        audioRef.current.currentTime = fraction * audioRef.current.duration;
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    setIsDragging(false);
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    const prog = calculateProgressFromClientX(e.clientX);
    setCurrentProgress(prog);
    startProgressRef.current = prog;

    if (audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = prog * audioRef.current.duration;
    }

    if (isPlaying) {
      if (audioRef.current) {
        runAudioRaf();
      } else {
        runSyntheticRaf();
      }
    }
  };

  const handlePointerLeave = () => {
    if (!isDraggingRef.current) {
      setHoverPosition(null);
    }
  };

  // Time format helper
  const formatTime = (secs: number) => {
    const s = Math.max(0, Math.floor(secs));
    const m = Math.floor(s / 60);
    const remainder = s % 60;
    return `${m}:${String(remainder).padStart(2, '0')}`;
  };

  // Current elapsed time in seconds
  const currentSecs = currentProgress * audioDuration;
  const displayTime = isPlaying || currentProgress > 0
    ? formatTime(currentSecs)
    : formatTime(audioDuration);

  // Percentage for mask and slider thumb
  const progressPercent = Math.max(0, Math.min(100, currentProgress * 100));

  return (
    <div className="flex items-center gap-3 py-1 select-none min-w-[210px] sm:min-w-[250px] max-w-full">
      {/* WhatsApp Style Play/Pause Circle */}
      <button
        type="button"
        onClick={togglePlay}
        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center cursor-pointer shadow-xs transition-transform active:scale-95 shrink-0 ${
          isCustomer
            ? 'bg-white text-navy-900 hover:bg-slate-100 shadow-black/10'
            : 'bg-navy-900 text-white dark:bg-brand-orange-500 dark:text-white hover:bg-navy-950 shadow-black/10'
        }`}
        title={isPlaying ? 'Pause voice note' : 'Play voice note'}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 ml-0.5 fill-current" />
        )}
      </button>

      {/* Waveform Track + Time & Speed Footer */}
      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Layered Liquid-Clip Dual Waveform with Live Gliding Slider Needle */}
        <div
          ref={waveformTrackRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          className="relative h-7 flex items-center cursor-pointer group touch-none py-1"
          title="Click or drag to scrub"
        >
          {/* Layer 1: Inactive / Unplayed Base Waveform (Muted Slate / Translucent White) */}
          <div className="absolute inset-0 flex items-center justify-between gap-[2px] pointer-events-none">
            {bars.map((height, i) => (
              <span
                key={i}
                className={`w-[2.5px] rounded-full transition-all duration-75 ${
                  isCustomer ? 'bg-white/30' : 'bg-slate-300 dark:bg-slate-700'
                }`}
                style={{ height: `${height}px` }}
              />
            ))}
          </div>

          {/* Layer 2: Active / Played Waveform (Liquid CSS Clip-Path Revealing In Real Time) */}
          <div
            className="absolute inset-0 flex items-center justify-between gap-[2px] pointer-events-none transition-none"
            style={{
              clipPath: `inset(0 ${100 - progressPercent}% 0 0)`
            }}
          >
            {bars.map((height, i) => (
              <span
                key={i}
                className={`w-[2.5px] rounded-full transition-all duration-75 ${
                  isCustomer
                    ? 'bg-brand-orange-400 dark:bg-brand-orange-300 shadow-2xs'
                    : 'bg-emerald-600 dark:bg-emerald-400 shadow-2xs'
                }`}
                style={{ height: `${height}px` }}
              />
            ))}
          </div>

          {/* Live Gliding Scrubber Needle / Thumb - Smoothly rides the audio in real-time */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -ml-1.5 w-3 h-3 flex items-center justify-center pointer-events-none z-10 transition-none"
            style={{
              left: `${progressPercent}%`
            }}
          >
            <div
              className={`w-2.5 h-2.5 rounded-full shadow-sm ring-2 ${
                isCustomer
                  ? 'bg-white ring-brand-orange-400/60'
                  : 'bg-emerald-600 dark:bg-emerald-400 ring-emerald-600/30 dark:ring-emerald-400/30'
              } ${isDragging ? 'scale-125' : 'scale-100'} transition-transform duration-75`}
            />
          </div>

          {/* Magnetic Scrub Tooltip preview on hover/drag */}
          {(isDragging || hoverPosition) && (
            <div
              className="absolute -top-6 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-900 text-white dark:bg-white dark:text-slate-900 pointer-events-none z-20 shadow-md -translate-x-1/2"
              style={{
                left: `${isDragging ? progressPercent : (hoverPosition ? (hoverPosition.fraction * 100) : progressPercent)}%`
              }}
            >
              {formatTime((isDragging ? currentProgress : (hoverPosition?.fraction || 0)) * audioDuration)}
            </div>
          )}
        </div>

        {/* Minimal Footer: Elapsed Time & WhatsApp-Style Speed Multiplier Pill */}
        <div className="flex items-center justify-between text-[11px] font-mono leading-none select-none px-0.5">
          <span
            className={`font-semibold tracking-tight ${
              isCustomer ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {displayTime}
          </span>

          <button
            type="button"
            onClick={handleSpeedToggle}
            className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold tracking-tight transition-colors cursor-pointer ${
              isCustomer
                ? 'bg-white/15 text-white hover:bg-white/25 active:bg-white/35'
                : 'bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300/80 dark:hover:bg-slate-700'
            }`}
            title="Toggle playback speed (1x, 1.5x, 2x)"
          >
            {playbackSpeed}x
          </button>
        </div>
      </div>
    </div>
  );
};
