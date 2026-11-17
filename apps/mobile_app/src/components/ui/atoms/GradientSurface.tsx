import React, { useState } from 'react';
import { View, StyleSheet, ViewStyle, LayoutChangeEvent } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

export interface GradientSurfaceProps {
  colors: readonly string[] | string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  borderRadius?: number;
  style?: ViewStyle | ViewStyle[];
  children?: React.ReactNode;
  overflowHidden?: boolean;
}

export const GradientSurface: React.FC<GradientSurfaceProps> = React.memo(
  ({
    colors,
    start = { x: 0, y: 0 },
    end = { x: 1, y: 1 },
    borderRadius = 0,
    style,
    children,
    overflowHidden = true,
  }) => {
    const [size, setSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

    const handleLayout = (e: LayoutChangeEvent) => {
      const { width, height } = e.nativeEvent.layout;
      if (width !== size.width || height !== size.height) {
        setSize({ width, height });
      }
    };

    const gradientId = React.useId
      ? React.useId()
      : `grad-${colors.join('-').replace(/[^a-zA-Z0-9]/g, '')}`;

    return (
      <View
        onLayout={handleLayout}
        style={[
          styles.container,
          borderRadius > 0 ? { borderRadius } : null,
          overflowHidden ? { overflow: 'hidden' } : null,
          style,
        ]}
      >
        {size.width > 0 && size.height > 0 && (
          <Svg
            style={StyleSheet.absoluteFill}
            width={size.width}
            height={size.height}
            pointerEvents="none"
          >
            <Defs>
              <LinearGradient
                id={gradientId}
                x1={`${start.x * 100}%`}
                y1={`${start.y * 100}%`}
                x2={`${end.x * 100}%`}
                y2={`${end.y * 100}%`}
              >
                {colors.map((color, index) => {
                  const offset =
                    colors.length > 1 ? `${(index / (colors.length - 1)) * 100}%` : '0%';
                  return <Stop key={index} offset={offset} stopColor={color} />;
                })}
              </LinearGradient>
            </Defs>
            <Rect
              x={0}
              y={0}
              width={size.width}
              height={size.height}
              rx={borderRadius}
              ry={borderRadius}
              fill={`url(#${gradientId})`}
            />
          </Svg>
        )}
        {children}
      </View>
    );
  },
);

GradientSurface.displayName = 'GradientSurface';

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
});
