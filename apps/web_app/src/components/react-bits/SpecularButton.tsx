import React, { useEffect, useRef, useState } from 'react';
import { Renderer, Program, Mesh, Triangle } from 'ogl';
import { cn } from '@/lib/utils';
import './SpecularButton.css';

export interface SpecularButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  size?: 'default' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  radius?: number | string;
  tint?: string;
  tintOpacity?: number;
  textColor?: string;
  lineColor?: string;
  baseColor?: string;
  intensity?: number;
  shineSize?: number;
  thickness?: number;
  speed?: number;
  followMouse?: boolean;
  autoAnimate?: boolean;
  className?: string;
}

const sizeClasses: Record<NonNullable<SpecularButtonProps['size']>, string> = {
  xs: 'h-7 px-2.5 text-xs rounded-lg gap-1',
  sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
  default: 'h-10 px-4 py-2 text-sm rounded-xl gap-2',
  md: 'h-10 px-4 text-sm rounded-xl gap-2',
  lg: 'h-11 px-6 text-base rounded-xl gap-2.5',
  xl: 'h-12 px-8 text-base rounded-xl gap-3',
};

function parseColorToRGB(
  colorStr?: string,
  fallback = [0.02, 0.25, 0.25],
): [number, number, number] {
  if (!colorStr) return fallback as [number, number, number];
  if (colorStr.startsWith('#')) {
    const hex = colorStr.slice(1);
    if (hex.length === 3) {
      return [
        parseInt(hex[0] + hex[0], 16) / 255,
        parseInt(hex[1] + hex[1], 16) / 255,
        parseInt(hex[2] + hex[2], 16) / 255,
      ];
    }
    if (hex.length === 6) {
      return [
        parseInt(hex.slice(0, 2), 16) / 255,
        parseInt(hex.slice(2, 4), 16) / 255,
        parseInt(hex.slice(4, 6), 16) / 255,
      ];
    }
  }
  return fallback as [number, number, number];
}

const vert = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const frag = `
precision highp float;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float uTime;
uniform vec3 uBaseColor;
uniform vec3 uLineColor;
uniform vec3 uTint;
uniform float uTintOpacity;
uniform float uIntensity;
uniform float uShineSize;
uniform float uThickness;
uniform float uHover;
varying vec2 vUv;

void main() {
  vec2 st = gl_FragCoord.xy / uResolution.xy;
  vec2 mouseNorm = uMouse / uResolution.xy;
  mouseNorm.y = 1.0 - mouseNorm.y; // Invert Y for WebGL coordinates
  
  float dist = distance(st, mouseNorm);
  float shine = exp(-dist * (6.0 / max(0.1, uShineSize))) * uIntensity * uHover;
  
  // Outer subtle specular border ring
  vec2 borderCoord = abs(st - 0.5) * 2.0;
  float edgeDist = max(borderCoord.x, borderCoord.y);
  float edgeFactor = smoothstep(1.0 - (uThickness / max(uResolution.x, uResolution.y)), 1.0, edgeDist);
  
  vec3 color = mix(uBaseColor, uLineColor, edgeFactor * 0.4);
  color = mix(color, uTint, uTintOpacity);
  color += uLineColor * shine * 0.75;
  
  gl_FragColor = vec4(color, 1.0);
}
`;

export const SpecularButton = React.forwardRef<HTMLButtonElement, SpecularButtonProps>(
  (
    {
      children,
      size = 'default',
      tint = '#14b8a6', // EduTrack bright teal in dark theme
      tintOpacity = 0.15,
      textColor = 'text-white',
      lineColor = '#5eead4', // Soft teal specular highlight
      baseColor = '#063f40', // Deep EduTrack Teal base
      intensity = 0.85,
      shineSize = 1.0,
      thickness = 2.0,
      speed = 1.0,
      followMouse = true,
      autoAnimate = false,
      disabled = false,
      className = '',
      onClick,
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const containerRef = useRef<HTMLButtonElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    // Merge forwarded ref
    useEffect(() => {
      if (!ref) return;
      if (typeof ref === 'function') {
        ref(containerRef.current);
      } else {
        (ref as React.MutableRefObject<HTMLButtonElement | null>).current = containerRef.current;
      }
    }, [ref]);

    // Check reduced motion preference
    useEffect(() => {
      if (typeof window === 'undefined') return;
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }, []);

    // WebGL Renderer Lifecycle using OGL
    useEffect(() => {
      const button = containerRef.current;
      const canvas = canvasRef.current;
      if (!button || !canvas || prefersReducedMotion || disabled) return;

      let renderer: Renderer | null = null;
      let animationFrameId: number | null = null;
      let mesh: Mesh | null = null;
      let program: Program | null = null;

      try {
        renderer = new Renderer({
          canvas,
          alpha: true,
          antialias: true,
          dpr: Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2),
        });

        const gl = renderer.gl;
        const geometry = new Triangle(gl);

        const uniforms = {
          uResolution: { value: [button.clientWidth, button.clientHeight] },
          uMouse: { value: [button.clientWidth * 0.5, button.clientHeight * 0.5] },
          uTime: { value: 0 },
          uBaseColor: { value: parseColorToRGB(baseColor, [0.02, 0.25, 0.25]) },
          uLineColor: { value: parseColorToRGB(lineColor, [0.37, 0.92, 0.83]) },
          uTint: { value: parseColorToRGB(tint, [0.08, 0.72, 0.65]) },
          uTintOpacity: { value: tintOpacity },
          uIntensity: { value: intensity },
          uShineSize: { value: shineSize },
          uThickness: { value: thickness },
          uHover: { value: autoAnimate ? 1.0 : 0.0 },
        };

        program = new Program(gl, {
          vertex: vert,
          fragment: frag,
          uniforms,
          transparent: true,
        });

        mesh = new Mesh(gl, { geometry, program });

        const resize = () => {
          if (!button || !renderer) return;
          const width = button.clientWidth;
          const height = button.clientHeight;
          if (width === 0 || height === 0) return;
          renderer.setSize(width, height);
          uniforms.uResolution.value = [width, height];
        };

        resize();

        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(button);

        let startTime = performance.now();

        const renderLoop = (time: number) => {
          if (!renderer || !mesh) return;
          uniforms.uTime.value = (time - startTime) * 0.001 * speed;

          // Smooth target hover value interpolation
          const targetHover = isHovered || autoAnimate ? 1.0 : 0.0;
          uniforms.uHover.value += (targetHover - uniforms.uHover.value) * 0.1;

          renderer.render({ scene: mesh });

          // Only continue loop if active/hovered or autoAnimate to conserve GPU
          if (isHovered || autoAnimate || uniforms.uHover.value > 0.01) {
            animationFrameId = requestAnimationFrame(renderLoop);
          } else {
            animationFrameId = null;
          }
        };

        // Trigger initial render
        renderer.render({ scene: mesh });

        if (isHovered || autoAnimate) {
          animationFrameId = requestAnimationFrame(renderLoop);
        }

        return () => {
          if (animationFrameId) cancelAnimationFrame(animationFrameId);
          resizeObserver.disconnect();
          try {
            const ext = gl.getExtension('WEBGL_lose_context');
            if (ext) ext.loseContext();
          } catch {
            // Context loss fallback
          }
        };
      } catch {
        // Fallback gracefully if WebGL is unavailable
        return () => {
          if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
      }
    }, [
      baseColor,
      lineColor,
      tint,
      tintOpacity,
      intensity,
      shineSize,
      thickness,
      speed,
      autoAnimate,
      isHovered,
      prefersReducedMotion,
      disabled,
    ]);

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!followMouse || disabled || prefersReducedMotion || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      props.onMouseMove?.(e);
    };

    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled && !prefersReducedMotion) {
        setIsHovered(true);
      }
      props.onMouseEnter?.(e);
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
      setIsHovered(false);
      props.onMouseLeave?.(e);
    };

    return (
      <button
        ref={containerRef}
        type={type}
        disabled={disabled}
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn(
          'specular-button bg-primary text-primary-foreground dark:bg-primary dark:text-white shadow-md border border-teal-500/30 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all',
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {!prefersReducedMotion && !disabled && (
          <canvas ref={canvasRef} aria-hidden="true" className="specular-button__canvas" />
        )}
        <span className={cn('specular-button__content', textColor)}>{children}</span>
      </button>
    );
  },
);

SpecularButton.displayName = 'SpecularButton';
export default SpecularButton;
