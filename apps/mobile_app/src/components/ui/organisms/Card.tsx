import React from 'react';
import { View, Text, TouchableOpacity, ViewProps } from 'react-native';

export interface CardProps extends ViewProps {
  title?: string;
  subtitle?: string;
  onPress?: () => void;
  headerAction?: React.ReactNode;
  variant?: 'default' | 'flat' | 'gradient' | 'bordered';
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  onPress,
  headerAction,
  variant = 'default',
  children,
  className = '',
  style,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'flat':
        return 'bg-slate-100 dark:bg-slate-800/60 border-0';
      case 'bordered':
        return 'bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700';
      case 'gradient':
        return 'bg-indigo-600 border-0 shadow-lg shadow-indigo-500/30';
      case 'default':
      default:
        return 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 shadow-sm shadow-slate-200/50 dark:shadow-none';
    }
  };

  const content = (
    <>
      {(title || subtitle || headerAction) && (
        <View className="flex-row items-center justify-between mb-3.5">
          <View className="flex-1 mr-2">
            {title && (
              <Text
                className={`text-base font-extrabold ${
                  variant === 'gradient' ? 'text-white' : 'text-slate-900 dark:text-slate-100'
                }`}
              >
                {title}
              </Text>
            )}
            {subtitle && (
              <Text
                className={`text-xs mt-0.5 font-medium ${
                  variant === 'gradient' ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {subtitle}
              </Text>
            )}
          </View>
          {headerAction && <View>{headerAction}</View>}
        </View>
      )}
      {children}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        className={`rounded-3xl p-5 my-2.5 ${getVariantStyles()} ${className}`}
        style={style}
        {...props}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View
      className={`rounded-3xl p-5 my-2.5 ${getVariantStyles()} ${className}`}
      style={style}
      {...props}
    >
      {content}
    </View>
  );
};
