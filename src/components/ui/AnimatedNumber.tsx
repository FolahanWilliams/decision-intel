'use client';

import { useEffect, useRef, useState } from 'react';

interface AnimatedNumberProps {
  value: number | string;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function AnimatedNumber({
  value,
  duration = 800,
  suffix = '',
  prefix = '',
  className,
  style,
}: AnimatedNumberProps) {
  const [displayed, setDisplayed] = useState<string>('0');
  const prevValue = useRef(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    const start = prevValue.current;
    const end = numericValue;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * eased;

      if (Number.isInteger(end)) {
        setDisplayed(Math.round(current).toLocaleString());
      } else {
        setDisplayed(current.toFixed(1));
      }

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        prevValue.current = end;
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value, duration]);

  return (
    <span className={className} style={style}>
      {prefix}
      {displayed}
      {suffix}
    </span>
  );
}
