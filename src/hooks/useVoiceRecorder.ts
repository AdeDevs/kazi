import { useCallback, useEffect, useRef, useState } from 'react';

export interface VoiceNote {
  /** data: URL of the recording, uploaded by the sender (see sendChat in App). */
  dataUrl: string;
  durationSeconds: number;
}

const BAR_COUNT = 36;

/**
 * Real microphone recording (MediaRecorder) with a live level waveform (Web Audio analyser).
 * start() asks for the mic; stop() resolves with the recording; cancel() discards it.
 */
export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [waveform, setWaveform] = useState<number[]>(() => new Array(BAR_COUNT).fill(6));

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const frameRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef(0);

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
    setWaveform(new Array(BAR_COUNT).fill(6));
    setIsRecording(false);
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
      const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg'].find(t => MediaRecorder.isTypeSupported(t));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorder.ondataavailable = (e) => { if (e.data?.size) chunksRef.current.push(e.data); };
      recorder.start(100);
      recorderRef.current = recorder;
      startedAtRef.current = Date.now();
      setSeconds(0);
      setIsRecording(true);
      timerRef.current = setInterval(() => {
        setSeconds(Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000)));
      }, 1000);

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx: AudioContext = new AudioCtx();
        audioCtxRef.current = ctx;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.65;
        ctx.createMediaStreamSource(stream).connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          analyser.getByteFrequencyData(data);
          setWaveform(Array.from({ length: BAR_COUNT }, (_, i) => {
            const v = data[Math.floor((i / BAR_COUNT) * (data.length * 0.75))] || 0;
            return Math.max(4, Math.min(26, Math.round((v / 255) * 26) + 4));
          }));
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
    const durationSeconds = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));
    return new Promise((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          release();
          resolve(typeof reader.result === 'string' ? { dataUrl: reader.result, durationSeconds } : null);
        };
        reader.readAsDataURL(blob);
      };
      recorder.stop();
    });
  }, [release]);

  return { isRecording, seconds, error, waveform, start, stop, cancel: release, clearError: () => setError(null) };
}
