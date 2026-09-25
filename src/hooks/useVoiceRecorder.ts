import { useCallback, useEffect, useRef, useState } from 'react';
import { toWav } from '../lib/audioWav';

export interface VoiceNote {
  /** data: URL of the recording, uploaded by the sender (see sendChat in App). */
  dataUrl: string;
  durationSeconds: number;
  /** The recording's real loudness shape, 0–1 per bar -- sent as audio_wave_data. */
  peaks: number[];
}

/** Bars in the live meter while recording, newest on the right. Enough to fill the widest
 *  composer (5px per bar); on narrower screens the oldest bars are simply clipped off the left. */
const LIVE_BARS = 160;
/** Bars in a saved voice note's waveform. */
export const PEAK_BARS = 40;
/** A new live bar every this many ms, so the meter scrolls at a steady pace. */
const SAMPLE_MS = 70;

// The chat upload accepts only audio/webm and audio/wav. WebM where the browser can record it
// (Chrome, Android, Firefox); Safari can only record MP4, which stop() converts to WAV.
const MIME_PREFERENCE = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
const UPLOADABLE = ['audio/webm', 'audio/wav'];

/** Squashes a level series into `count` bars (peak of each bucket), scaled so the loudest is 1. */
export function toPeaks(levels: number[], count = PEAK_BARS): number[] {
  if (!levels.length) return new Array(count).fill(0.15);
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    const start = Math.floor((i / count) * levels.length);
    const end = Math.max(start + 1, Math.floor(((i + 1) / count) * levels.length));
    out.push(Math.max(...levels.slice(start, end)));
  }
  const max = Math.max(...out, 0.01);
  return out.map(v => Math.round(Math.max(0.08, v / max) * 100) / 100);
}

/**
 * Real microphone recording (MediaRecorder) with a live, scrolling level meter (Web Audio).
 * start() asks for the mic; stop() resolves with the recording; cancel() discards it.
 */
export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  /** Live meter, 0–1 per bar, oldest first. */
  const [levels, setLevels] = useState<number[]>(() => new Array(LIVE_BARS).fill(0));

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const frameRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef(0);
  // Paused time is left out of the timer and the note's duration.
  const pausedTotalRef = useRef(0);
  const pausedAtRef = useRef<number | null>(null);
  const elapsedMs = () => Date.now() - startedAtRef.current - pausedTotalRef.current - (pausedAtRef.current ? Date.now() - pausedAtRef.current : 0);
  const allLevelsRef = useRef<number[]>([]);

  const release = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') audioCtxRef.current.close().catch(() => undefined);
    timerRef.current = null;
    frameRef.current = null;
    streamRef.current = null;
    audioCtxRef.current = null;
    recorderRef.current = null;
    chunksRef.current = [];
    setLevels(new Array(LIVE_BARS).fill(0));
    setIsRecording(false);
    setIsPaused(false);
    pausedAtRef.current = null;
    pausedTotalRef.current = 0;
  }, []);

  useEffect(() => release, [release]);

  const start = useCallback(async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('This browser can’t record audio.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;
      chunksRef.current = [];
      allLevelsRef.current = [];
      const mimeType = MIME_PREFERENCE.find(t => MediaRecorder.isTypeSupported(t));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorder.ondataavailable = (e) => { if (e.data?.size) chunksRef.current.push(e.data); };
      recorder.start(100);
      recorderRef.current = recorder;
      startedAtRef.current = Date.now();
      pausedTotalRef.current = 0;
      pausedAtRef.current = null;
      setSeconds(0);
      setIsPaused(false);
      setIsRecording(true);
      timerRef.current = setInterval(() => {
        setSeconds(Math.floor(elapsedMs() / 1000));
      }, 250);

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx: AudioContext = new AudioCtx();
        audioCtxRef.current = ctx;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        ctx.createMediaStreamSource(stream).connect(analyser);
        const data = new Uint8Array(analyser.fftSize);
        let lastPush = 0;
        let peakSinceLast = 0;
        const tick = (now: number) => {
          if (pausedAtRef.current) {
            // Paused: the meter holds still until recording resumes.
            frameRef.current = requestAnimationFrame(tick);
            return;
          }
          analyser.getByteTimeDomainData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) {
            const v = (data[i] - 128) / 128;
            sum += v * v;
          }
          // RMS of speech sits around 0.02–0.3; this curve spreads that across the meter's height.
          const level = Math.min(1, Math.sqrt(Math.sqrt(sum / data.length)) * 1.6);
          peakSinceLast = Math.max(peakSinceLast, level);
          if (now - lastPush >= SAMPLE_MS) {
            const sample = peakSinceLast;
            allLevelsRef.current.push(sample);
            setLevels(prev => [...prev.slice(1), sample]);
            peakSinceLast = 0;
            lastPush = now;
          }
          frameRef.current = requestAnimationFrame(tick);
        };
        frameRef.current = requestAnimationFrame(tick);
      }
    } catch (err: any) {
      release();
      setError(
        err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError'
          ? 'Microphone access was denied. Allow it in your browser settings and try again.'
          : err?.name === 'NotFoundError'
            ? 'No microphone was found on this device.'
            : 'Couldn’t start recording. Try again.'
      );
    }
  }, [release]);

  const stop = useCallback((): Promise<VoiceNote | null> => {
    const recorder = recorderRef.current;
    if (!recorder) return Promise.resolve(null);
    const durationSeconds = Math.max(1, Math.round(elapsedMs() / 1000));
    const peaks = toPeaks(allLevelsRef.current);
    return new Promise((resolve) => {
      recorder.onstop = async () => {
        let blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (!UPLOADABLE.includes(blob.type.split(';')[0])) {
          try {
            blob = await toWav(blob);
          } catch {
            release();
            setError('Couldn’t prepare that recording on this browser. Try again, or type your message.');
            resolve(null);
            return;
          }
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          release();
          resolve(typeof reader.result === 'string' ? { dataUrl: reader.result, durationSeconds, peaks } : null);
        };
        reader.readAsDataURL(blob);
      };
      recorder.stop();
    });
  }, [release]);

  const pause = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== 'recording') return;
    recorder.pause();
    pausedAtRef.current = Date.now();
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== 'paused') return;
    recorder.resume();
    if (pausedAtRef.current) pausedTotalRef.current += Date.now() - pausedAtRef.current;
    pausedAtRef.current = null;
    setIsPaused(false);
  }, []);

  return { isRecording, isPaused, seconds, error, levels, start, stop, pause, resume, cancel: release, clearError: () => setError(null) };
}
