import { useState, useEffect, useRef, useCallback } from 'react';

interface UseAnimatorProps {
  duration: number;
}

export function useAnimator({ duration }: UseAnimatorProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 1
  
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const tick = useCallback((time: number) => {
    if (lastTimeRef.current === 0) lastTimeRef.current = time;
    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;

    setProgress((prev) => {
      let next = prev + deltaTime / duration;
      if (next >= 1) {
        next = 1;
        setIsPlaying(false);
      }
      return next;
    });

    rafRef.current = requestAnimationFrame(tick);
  }, [duration]);

  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = 0;
      rafRef.current = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(rafRef.current);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, tick]);

  useEffect(() => {
    if (progress >= 1 && isPlaying) {
      setIsPlaying(false);
    }
  }, [progress, isPlaying]);

  const play = useCallback(() => {
    if (progress >= 1) setProgress(0);
    setIsPlaying(true);
  }, [progress]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const restart = useCallback(() => {
    setProgress(0);
    setIsPlaying(true);
  }, []);

  const scrub = useCallback((newProgress: number) => {
    setIsPlaying(false);
    setProgress(Math.max(0, Math.min(1, newProgress)));
  }, []);

  return { isPlaying, progress, play, pause, restart, scrub };
}
