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
    const [webglFailed, setWebglFailed] = useState(false);

    const isHoveredRef = useRef(false);
    const autoAnimateRef = useRef(autoAnimate);
    const speedRef = useRef(speed);
    const mouseRef = useRef<[number, number] | null>(null);
    const uniformsRef = useRef<Record<string, { value: any }> | null>(null);
    const startLoopRef = useRef<(() => void) | null>(null);

    autoAnimateRef.current = autoAnimate;
    speedRef.current = speed;

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

    // Sync shader uniforms cleanly without recreating the WebGL context
    useEffect(() => {
      const uniforms = uniformsRef.current;
      if (!uniforms) return;
      uniforms.uBaseColor.value = parseColorToRGB(baseColor, [0.02, 0.25, 0.25]);
      uniforms.uLineColor.value = parseColorToRGB(lineColor, [0.37, 0.92, 0.83]);
      uniforms.uTint.value = parseColorToRGB(tint, [0.08, 0.72, 0.65]);
      uniforms.uTintOpacity.value = tintOpacity;
      uniforms.uIntensity.value = intensity;
      uniforms.uShineSize.value = shineSize;
      uniforms.uThickness.value = thickness;
      if (autoAnimate) {
        startLoopRef.current?.();
      }
    }, [baseColor, lineColor, tint, tintOpacity, intensity, shineSize, thickness, autoAnimate]);

    // WebGL Renderer Lifecycle using OGL (created once per active mount; never torn down on hover)
    useEffect(() => {
      const button = containerRef.current;
      const canvas = canvasRef.current;
      if (!button || !canvas || prefersReducedMotion || disabled || webglFailed) return;

      let renderer: Renderer | null = null;
      let animationFrameId: number | null = null;
      let mesh: Mesh | null = null;
      let program: Program | null = null;
      let resizeObserver: ResizeObserver | null = null;
      let isDisposed = false;
      let isContextLost = false;

      const handleContextLost = (e: Event) => {
        e.preventDefault();
        isContextLost = true;
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
        setWebglFailed(true);
      };

      const handleContextRestored = () => {
        isContextLost = false;
        setWebglFailed(false);
      };

      canvas.addEventListener('webglcontextlost', handleContextLost, false);
      canvas.addEventListener('webglcontextrestored', handleContextRestored, false);

      try {
        renderer = new Renderer({
          canvas,
          alpha: true,
          antialias: true,
          dpr: Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2),
        });

        const gl = renderer.gl;
        if (!gl || gl.isContextLost()) {
          setWebglFailed(true);
          canvas.removeEventListener('webglcontextlost', handleContextLost);
          canvas.removeEventListener('webglcontextrestored', handleContextRestored);
          return;
        }

        const geometry = new Triangle(gl);
        const initW = Math.max(button.clientWidth, 1);
        const initH = Math.max(button.clientHeight, 1);

        const uniforms = {
          uResolution: { value: [initW, initH] },
          uMouse: { value: mouseRef.current ?? [initW * 0.5, initH * 0.5] },
          uTime: { value: 0 },
          uBaseColor: { value: parseColorToRGB(baseColor, [0.02, 0.25, 0.25]) },
          uLineColor: { value: parseColorToRGB(lineColor, [0.37, 0.92, 0.83]) },
          uTint: { value: parseColorToRGB(tint, [0.08, 0.72, 0.65]) },
          uTintOpacity: { value: tintOpacity },
          uIntensity: { value: intensity },
          uShineSize: { value: shineSize },
          uThickness: { value: thickness },
          uHover: { value: autoAnimateRef.current ? 1.0 : 0.0 },
        };
        uniformsRef.current = uniforms;

        program = new Program(gl, {
          vertex: vert,
          fragment: frag,
          uniforms,
          transparent: true,
        });

        mesh = new Mesh(gl, { geometry, program });

        const renderFrame = () => {
          if (isDisposed || isContextLost || !renderer || !mesh || gl.isContextLost()) {
            return false;
          }
          try {
            renderer.render({ scene: mesh });
            return true;
          } catch {
            setWebglFailed(true);
            return false;
          }
        };

        const resize = () => {
          if (isDisposed || isContextLost || !button || !renderer || gl.isContextLost()) return;
          const width = button.clientWidth;
          const height = button.clientHeight;
          if (width === 0 || height === 0) return;
          renderer.setSize(width, height);
          uniforms.uResolution.value = [width, height];
          if (!mouseRef.current) {
            uniforms.uMouse.value = [width * 0.5, height * 0.5];
          }
          renderFrame();
        };

        resize();

        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(button);

        const startTime = performance.now();

        const renderLoop = (time: number) => {
          animationFrameId = null;
          if (isDisposed || isContextLost || !renderer || !mesh || gl.isContextLost()) return;

          uniforms.uTime.value = (time - startTime) * 0.001 * speedRef.current;
          if (mouseRef.current) {
            uniforms.uMouse.value = mouseRef.current;
          }

          const hoveredOrAuto = isHoveredRef.current || autoAnimateRef.current;
          const targetHover = hoveredOrAuto ? 1.0 : 0.0;
          uniforms.uHover.value += (targetHover - uniforms.uHover.value) * 0.1;

          if (!renderFrame()) return;

          if (hoveredOrAuto || uniforms.uHover.value > 0.01) {
            animationFrameId = requestAnimationFrame(renderLoop);
          }
        };

        const startLoop = () => {
          if (isDisposed || isContextLost || animationFrameId !== null) return;
          animationFrameId = requestAnimationFrame(renderLoop);
        };
        startLoopRef.current = startLoop;

        renderFrame();
        if (isHoveredRef.current || autoAnimateRef.current) {
          startLoop();
        }

        return () => {
          isDisposed = true;
          startLoopRef.current = null;
          uniformsRef.current = null;
          if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
          }
          if (resizeObserver) {
            resizeObserver.disconnect();
            resizeObserver = null;
          }
          canvas.removeEventListener('webglcontextlost', handleContextLost);
          canvas.removeEventListener('webglcontextrestored', handleContextRestored);
          try {
            if (program && !gl.isContextLost()) {
              gl.deleteProgram(program.program);
            }
          } catch {
            // Safe cleanup when WebGL context is unavailable
          }
        };
      } catch {
        // Fallback gracefully to CSS surface if WebGL initialization fails
        setWebglFailed(true);
        canvas.removeEventListener('webglcontextlost', handleContextLost);
        canvas.removeEventListener('webglcontextrestored', handleContextRestored);
        return () => {
          isDisposed = true;
          startLoopRef.current = null;
          uniformsRef.current = null;
          if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
          }
        };
      }
    }, [prefersReducedMotion, disabled, webglFailed]);

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (followMouse && !disabled && !prefersReducedMotion && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = rect.height - (e.clientY - rect.top);
        mouseRef.current = [x, y];
        startLoopRef.current?.();
      }
      props.onMouseMove?.(e);
    };

    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled && !prefersReducedMotion) {
        isHoveredRef.current = true;
        startLoopRef.current?.();
      }
      props.onMouseEnter?.(e);
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
      isHoveredRef.current = false;
      startLoopRef.current?.();
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
        {!prefersReducedMotion && !disabled && !webglFailed && (
          <canvas ref={canvasRef} aria-hidden="true" className="specular-button__canvas" />
        )}
        <span className={cn('specular-button__content', textColor)}>{children}</span>
      </button>
    );
  },
);

SpecularButton.displayName = 'SpecularButton';
export default SpecularButton;
