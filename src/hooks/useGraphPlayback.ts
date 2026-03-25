import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

interface PlaybackNode {
  createdAt: string;
}

interface UseGraphPlaybackParams {
  nodes: PlaybackNode[];
  intervalMs?: number;
}

export function useGraphPlayback({ nodes, intervalMs = 1000 }: UseGraphPlaybackParams) {
  const [currentWeek, setCurrentWeek] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(intervalMs);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Compute week boundaries from node dates
  const weekBoundaries = (() => {
    if (!nodes.length) return [];
    const dates = nodes
      .map(n => new Date(n.createdAt).getTime())
      .filter(t => !isNaN(t))
      .sort((a, b) => a - b);
    if (!dates.length) return [];

    const minDate = dates[0];
    const maxDate = dates[dates.length - 1];
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const weeks: Date[] = [];
    let current = minDate;
    while (current <= maxDate + msPerWeek) {
      weeks.push(new Date(current));
      current += msPerWeek;
    }
    return weeks;
  })();

  const totalWeeks = Math.max(1, weekBoundaries.length);

  const currentDate = useMemo(
    () => weekBoundaries[Math.min(currentWeek, weekBoundaries.length - 1)] || new Date(),
    [weekBoundaries, currentWeek]
  );

  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);

  const seekTo = useCallback((week: number) => {
    setCurrentWeek(Math.max(0, Math.min(week, totalWeeks - 1)));
  }, [totalWeeks]);

  const filterNode = useCallback((node: PlaybackNode) => {
    if (!weekBoundaries.length) return true;
    const nodeTime = new Date(node.createdAt).getTime();
    return nodeTime <= currentDate.getTime();
  }, [weekBoundaries.length, currentDate]);

  // Auto-advance when playing
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentWeek(prev => {
          if (prev >= totalWeeks - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speed, totalWeeks]);

  return {
    currentWeek,
    totalWeeks,
    isPlaying,
    play,
    pause,
    seekTo,
    setSpeed,
    currentDate,
    filterNode,
    hasPlayback: weekBoundaries.length > 1,
  };
}
