'use client';

import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Glass Micro-Interactions Library
 *
 * Enhanced interactive behaviors for liquid glass components
 * Maintains black/white design with red/orange/green accents
 */

interface GlassRippleProps {
  className?: string;
  color?: 'default' | 'success' | 'error' | 'warning';
  children: React.ReactNode;
}

/**
 * Glass Ripple Effect on Click
 * Creates concentric glass ripples emanating from click point
 */
export function GlassRipple({ className, color = 'default', children }: GlassRippleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

  const handleClick = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples(prev => [...prev, { x, y, id }]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id));
    }, 1000);
  };

  const colorClasses = {
    default: 'bg-white/20',
    success: 'bg-green-500/20',
    error: 'bg-red-500/20',
    warning: 'bg-orange-500/20',
  };

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', className)}
      onClick={handleClick}
    >
      {children}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className={cn(
            'absolute pointer-events-none rounded-full',
            'animate-glass-ripple',
            colorClasses[color]
          )}
          style={{
            left: ripple.x,
            top: ripple.y,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
    </div>
  );
}

interface GlassPressureProps {
  className?: string;
  children: React.ReactNode;
  onPressureChange?: (pressure: number) => void;
}

/**
 * Pressure-Sensitive Glass
 * Glass opacity changes based on interaction intensity
 */
export function GlassPressure({ className, children, onPressureChange }: GlassPressureProps) {
  const [pressure, setPressure] = useState(0);
  const [isPressed, setIsPressed] = useState(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsPressed(true);
    // Use pressure API if available (mainly for stylus/touch)
    const p = e.pressure || 0.5;
    setPressure(p);
    onPressureChange?.(p);
  };

  const handlePointerUp = () => {
    setIsPressed(false);
    setPressure(0);
    onPressureChange?.(0);
  };

  return (
    <div
      className={cn(
        'transition-all duration-300',
        'liquid-glass-advanced',
        className
      )}
      style={{
        '--glass-pressure': pressure,
        '--glass-opacity': isPressed ? 0.05 + pressure * 0.15 : 0.05,
        transform: isPressed ? `scale(${1 - pressure * 0.02})` : 'scale(1)',
      } as React.CSSProperties}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {children}
    </div>
  );
}

interface GlassMorphProps {
  className?: string;
  morphState: 'flat' | 'curved' | 'bubble';
  children: React.ReactNode;
}

/**
 * Glass Morphing Component
 * Smooth transitions between different glass states
 */
export function GlassMorph({ className, morphState, children }: GlassMorphProps) {
  const morphClasses = {
    flat: 'liquid-glass',
    curved: 'liquid-glass-curved',
    bubble: 'liquid-glass-bubble',
  };

  return (
    <div
      className={cn(
        'transition-all duration-700 ease-out',
        morphClasses[morphState],
        className
      )}
    >
      {children}
    </div>
  );
}

interface GlassLoadingProps {
  variant: 'fill' | 'pulse' | 'wave' | 'spin';
  color?: 'white' | 'success' | 'error' | 'warning';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Glass Loading Indicators
 * Various loading animations with glass effects
 */
export function GlassLoading({ variant, color = 'white', size = 'md' }: GlassLoadingProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const colorMap = {
    white: 'border-white/30',
    success: 'border-green-500/40',
    error: 'border-red-500/40',
    warning: 'border-orange-500/40',
  };

  if (variant === 'fill') {
    return (
      <div className={cn('relative rounded-full liquid-glass overflow-hidden', sizeClasses[size])}>
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-t from-white/20 to-transparent',
            'animate-glass-fill'
          )}
        />
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div
        className={cn(
          'rounded-full liquid-glass',
          'animate-glass-pulse',
          sizeClasses[size]
        )}
      />
    );
  }

  if (variant === 'wave') {
    return (
      <div className={cn('relative rounded liquid-glass overflow-hidden', sizeClasses[size])}>
        <div className="absolute inset-0 animate-glass-wave">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>
      </div>
    );
  }

  if (variant === 'spin') {
    return (
      <div
        className={cn(
          'rounded-lg border-2',
          'animate-glass-spin',
          sizeClasses[size],
          colorMap[color]
        )}
        style={{
          borderTopColor: 'transparent',
          borderRightColor: 'transparent',
        }}
      />
    );
  }

  return null;
}

interface GlassHoverProps {
  className?: string;
  children: React.ReactNode;
  intensity?: 'subtle' | 'medium' | 'strong';
}

/**
 * Enhanced Glass Hover State
 * 3D rotation and refraction changes on hover
 */
export function GlassHover({ className, children, intensity = 'medium' }: GlassHoverProps) {
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    const rotateY = x * (intensity === 'strong' ? 10 : intensity === 'medium' ? 5 : 2);
    const rotateX = -y * (intensity === 'strong' ? 10 : intensity === 'medium' ? 5 : 2);

    containerRef.current.style.transform = `
      perspective(1000px)
      rotateY(${rotateY}deg)
      rotateX(${rotateX}deg)
      scale(${isHovered ? 1.02 : 1})
    `;
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (containerRef.current) {
      containerRef.current.style.transform = 'perspective(1000px) rotateY(0) rotateX(0) scale(1)';
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'transition-transform duration-300 ease-out',
        'liquid-glass-advanced',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: 'preserve-3d',
      }}
    >
      <div
        className={cn(
          'transition-all duration-300',
          isHovered && 'glass-hover-glow'
        )}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Glass Success/Error Feedback
 * Visual feedback with contextual glass effects
 */
interface GlassFeedbackProps {
  type: 'success' | 'error' | 'warning' | 'info';
  children: React.ReactNode;
  isActive?: boolean;
}

export function GlassFeedback({ type, children, isActive = false }: GlassFeedbackProps) {
  const feedbackClasses = {
    success: 'glass-feedback-success',
    error: 'glass-feedback-error',
    warning: 'glass-feedback-warning',
    info: 'glass-feedback-info',
  };

  const glowColors = {
    success: 'shadow-green-500/30',
    error: 'shadow-red-500/30',
    warning: 'shadow-orange-500/30',
    info: 'shadow-blue-500/30',
  };

  return (
    <div
      className={cn(
        'transition-all duration-500',
        'liquid-glass',
        isActive && feedbackClasses[type],
        isActive && `shadow-lg ${glowColors[type]}`
      )}
    >
      {children}
      {isActive && type === 'error' && (
        <div className="absolute inset-0 pointer-events-none glass-crack-pattern opacity-30" />
      )}
      {isActive && type === 'success' && (
        <div className="absolute inset-0 pointer-events-none glass-sparkle-effect" />
      )}
    </div>
  );
}