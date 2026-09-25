import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, Pause, Play } from 'lucide-react';
import { PEAK_BARS, toPeaks } from '../../hooks/useVoiceRecorder';

interface VoiceNotePlayerProps {
  msgId: string;
  /** The uploaded recording (or a data: URL while it's still sending). */
  src?: string;
  /** Seconds, as recorded -- MediaRecorder WebM files often report no duration of their own. */
  duration?: number;
  /** The recording's real waveform (audio_wave_data), 0–1 per bar. Decoded from the audio if absent. */
  peaks?: number[];
  isMine: boolean;
  /** Only one voice note plays at a time across the thread. */
  activeId: string | null;
  onActiveChange: (id: string | null) => void;
  /** The bubble's time + read ticks, shown on the player's second line (see ChatBubble's BubbleMeta). */
  meta?: React.ReactNode;
}

// Waveforms decoded from the audio itself, for notes sent without audio_wave_data. Keyed by URL.
const decodedPeaks = new Map<string, Promise<{ peaks: number[]; duration: number } | null>>();

function decodePeaks(src: string) {
  let pending = decodedPeaks.get(src);
  if (!pending) {
    pending = (async () => {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return null;
        const bytes = await (await fetch(src)).arrayBuffer();
        const ctx: AudioContext = new AudioCtx();
        const buffer = await ctx.decodeAudioData(bytes);
        ctx.close().catch(() => undefined);
        const channel = buffer.getChannelData(0);
        const step = Math.max(1, Math.floor(channel.length / (PEAK_BARS * 8)));
        const levels: number[] = [];
        for (let i = 0; i < channel.length; i += step) {
          let peak = 0;
          for (let j = i; j < Math.min(i + step, channel.length); j++) peak = Math.max(peak, Math.abs(channel[j]));
          levels.push(peak);
        }
        return { peaks: toPeaks(levels), duration: buffer.duration };
      } catch {
        return null;
      }
    })();
    decodedPeaks.set(src, pending);
  }
  return pending;
}

const SPEEDS = [1, 1.5, 2] as const;

// Bar geometry is fixed and shared by sent and received notes: only colours differ.
const BAR = 3;
const GAP = 2;
/** Waveform width grows with the clip's length, within limits, so a 3s note is visibly shorter than a 40s one. */
const waveWidthFor = (seconds: number) => Math.round(Math.min(180, Math.max(84, 64 + seconds * 6)));

/** Resamples a waveform to `count` bars (peak of each span), so any clip fills its width exactly. */
function resample(peaks: number[], count: number): number[] {
  if (!peaks.length) return new Array(count).fill(0.18);
  return Array.from({ length: count }, (_, i) => {
    const start = Math.floor((i / count) * peaks.length);
    const end = Math.max(start + 1, Math.floor(((i + 1) / count) * peaks.length));
    return Math.max(...peaks.slice(start, end));
  });
}

export const formatClock = (secs: number) => {
  const s = Math.max(0, Math.floor(secs));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** A voice note: play/pause, the real waveform (tap or drag to seek), time, and playback speed. */
export const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({ msgId, src, duration, peaks, isMine, activeId, onActiveChange, meta }) => {
  const [bars, setBars] = useState<number[] | null>(peaks?.length ? peaks : null);
  const [knownDuration, setKnownDuration] = useState(duration || 0);
  const [progress, setProgress] = useState(0);
  const [state, setState] = useState<'idle' | 'loading' | 'playing' | 'error'>(src ? 'idle' : 'error');
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    if (peaks?.length) { setBars(peaks); return; }
    if (!src) return;
    let cancelled = false;
    decodePeaks(src).then(result => {
      if (cancelled || !result) return;
      setBars(result.peaks);
      if (!duration && result.duration) setKnownDuration(result.duration);
    });
    return () => { cancelled = true; };
  }, [src, peaks, duration]);

  const totalSeconds = () => {
    const d = audioRef.current?.duration;
    return d && Number.isFinite(d) ? d : knownDuration;
  };

  const stopTicking = () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
  };

  const tick = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const total = audio.duration && Number.isFinite(audio.duration) ? audio.duration : knownDuration;
    if (!draggingRef.current && total) setProgress(Math.min(1, audio.currentTime / total));
    frameRef.current = requestAnimationFrame(tick);
  }, [knownDuration]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    stopTicking();
    setState(s => (s === 'error' ? s : 'idle'));
  }, []);

  // Another voice note started: this one pauses where it is.
  useEffect(() => {
    if (activeId !== msgId && state === 'playing') pause();
  }, [activeId, msgId, state, pause]);

  useEffect(() => () => {
    stopTicking();
    audioRef.current?.pause();
    audioRef.current = null;
  }, []);

  const ensureAudio = () => {
    if (audioRef.current || !src) return audioRef.current;
    const audio = new Audio(src);
    audio.preload = 'auto';
    audio.onended = () => {
      stopTicking();
      setProgress(0);
      setState('idle');
      onActiveChange(null);
    };
    audio.onerror = () => {
      stopTicking();
      setState('error');
      onActiveChange(null);
    };
    audioRef.current = audio;
    return audio;
  };

  const play = async () => {
    const audio = ensureAudio();
    if (!audio) return;
    onActiveChange(msgId);
    audio.playbackRate = speed;
    const total = totalSeconds();
    if (progress >= 0.999) audio.currentTime = 0;
    else if (total) audio.currentTime = progress * total;
    setState('loading');
    try {
      await audio.play();
      setState('playing');
      stopTicking();
      frameRef.current = requestAnimationFrame(tick);
    } catch {
      setState('error');
      onActiveChange(null);
    }
  };

  const toggle = () => (state === 'playing' || state === 'loading' ? (pause(), onActiveChange(null)) : play());

  const seekTo = (fraction: number) => {
    const f = Math.max(0, Math.min(1, fraction));
    setProgress(f);
    const audio = audioRef.current;
    const total = totalSeconds();
    if (audio && total) audio.currentTime = f * total;
  };
  const fractionAt = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    return rect ? (clientX - rect.left) / rect.width : 0;
  };

  const cycleSpeed = () => {
    const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
    setSpeed(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const total = knownDuration || duration || 0;
  const started = state === 'playing' || state === 'loading' || progress > 0;

  // Exactly as many bars as fit, and the track exactly that wide: no gap before the bubble's edge.
  const barCount = Math.max(12, Math.floor((waveWidthFor(total) + GAP) / (BAR + GAP)));
  const trackWidth = barCount * (BAR + GAP) - GAP;
  const shownBars = resample(bars ?? [], barCount);

  const iconColor = isMine ? 'text-white' : 'text-navy-700 dark:text-navy-200';
  const baseBar = isMine ? 'bg-white/35' : 'bg-slate-300 dark:bg-slate-600';
  const playedBar = isMine ? 'bg-white' : 'bg-navy-600 dark:bg-navy-300';
  const barRow = (color: string) => shownBars.map((peak, i) => (
    <span key={i} className={`shrink-0 rounded-full ${color}`} style={{ width: BAR, height: `${Math.max(3, Math.round(peak * 24))}px` }} />
  ));

  return (
    <div className="pt-0.5 select-none">
      {/* Line 1: play, the waveform (tap or drag to seek), and the duration -- all on one centre line. */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggle}
          disabled={state === 'error'}
          aria-label={state === 'playing' ? 'Pause voice note' : 'Play voice note'}
          className={`w-8 h-8 -ml-1 shrink-0 flex items-center justify-center cursor-pointer rounded-lg transition-transform duration-150 active:scale-[0.88] disabled:cursor-not-allowed disabled:opacity-60 ${iconColor}`}
        >
          {state === 'loading' ? (
            <span className={`w-4 h-4 border-2 rounded-full animate-spin ${isMine ? 'border-white/30 border-t-white' : 'border-navy-700/25 border-t-navy-700 dark:border-navy-200/25 dark:border-t-navy-200'}`} />
          ) : state === 'playing' ? (
            <Pause className="w-5 h-5 fill-current" />
          ) : state === 'error' ? (
            <AlertCircle className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5 fill-current" />
          )}
        </button>

        <div
          ref={trackRef}
          role="slider"
          tabIndex={state === 'error' ? -1 : 0}
          aria-label="Voice note position"
          aria-valuemin={0}
          aria-valuemax={Math.round(total)}
          aria-valuenow={Math.round(progress * total)}
          aria-valuetext={`${formatClock(progress * total)} of ${formatClock(total)}`}
          onKeyDown={(e) => {
            if (!total) return;
            if (e.key === 'ArrowRight') { e.preventDefault(); seekTo(progress + 5 / total); }
            if (e.key === 'ArrowLeft') { e.preventDefault(); seekTo(progress - 5 / total); }
          }}
          onPointerDown={(e) => {
            if (state === 'error') return;
            draggingRef.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            seekTo(fractionAt(e.clientX));
          }}
          onPointerMove={(e) => { if (draggingRef.current) seekTo(fractionAt(e.clientX)); }}
          onPointerUp={(e) => {
            draggingRef.current = false;
            try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* already released */ }
          }}
          style={{ width: trackWidth }}
          className="relative h-8 shrink-0 cursor-pointer touch-none focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-400/60 rounded"
        >
          {/* Base bars, then the same bars in the played colour clipped to the playhead -- so the
              fill sweeps smoothly through a bar instead of jumping bar by bar. */}
          <div className="absolute inset-0 flex items-center" style={{ gap: GAP }}>{barRow(baseBar)}</div>
          <div
            className="absolute inset-0 flex items-center pointer-events-none"
            style={{ gap: GAP, clipPath: `inset(0 ${100 - progress * 100}% 0 0)` }}
            aria-hidden="true"
          >
            {barRow(playedBar)}
          </div>
        </div>

        <span className={`w-8 shrink-0 text-[11px] font-semibold tabular-nums ${isMine ? 'text-white/80' : 'text-slate-600 dark:text-slate-300'}`}>
          {state === 'error' ? '—' : formatClock(started ? progress * total : total)}
        </span>
      </div>

      {/* Line 2: a quiet speed control on the left, the bubble's time and ticks on the right. */}
      <div className="flex items-center justify-between gap-3 mt-0.5 pl-9">
        {state === 'error' ? (
          <span className={`text-[10px] ${isMine ? 'text-white/70' : 'text-slate-500'}`}>Can’t play this voice note</span>
        ) : (
          <button
            type="button"
            onClick={cycleSpeed}
            aria-label={`Playback speed ${speed}×`}
            className={`text-[10px] font-bold tabular-nums cursor-pointer transition-opacity duration-150 ${
              speed === 1 ? 'opacity-45 hover:opacity-90 active:opacity-100' : 'opacity-90'
            } ${isMine ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}
          >
            {speed}×
          </button>
        )}
        {meta}
      </div>
    </div>
  );
};
