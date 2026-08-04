import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps, View } from 'react-native';
import { useTheme } from '../../../theme';

export interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  style,
  ...props
}) => {
  const { colors } = useTheme();

  const getContainerStyles = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-slate-800 dark:bg-slate-700 shadow-sm';
      case 'outline':
        return 'border border-slate-300 dark:border-slate-700 bg-transparent';
      case 'ghost':
        return 'bg-transparent';
      case 'danger':
        return 'bg-red-600 shadow-md shadow-red-500/20';
      case 'primary':
      default:
        return 'bg-indigo-600 shadow-md shadow-indigo-500/25';
    }
  };

  const getTextStyles = () => {
    switch (variant) {
      case 'outline':
        return 'text-slate-800 dark:text-slate-100 font-semibold';
      case 'ghost':
        return 'text-indigo-600 dark:text-indigo-400 font-semibold';
      case 'secondary':
      case 'danger':
      case 'primary':
      default:
        return 'text-white font-bold';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-4 py-2.5 rounded-xl';
      case 'lg':
        return 'px-6 py-4 rounded-2xl';
      case 'md':
      default:
        return 'px-5 py-3.5 rounded-2xl';
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'sm':
        return 'text-xs';
      case 'lg':
        return 'text-base';
      case 'md':
      default:
        return 'text-sm';
    }
  };

  const loaderColor = variant === 'outline' || variant === 'ghost' ? colors.primary : colors.white;

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      disabled={disabled || isLoading}
      accessibilityRole="button"
      accessibilityLabel={title}
      className={`flex-row items-center justify-center ${getContainerStyles()} ${getSizeStyles()} ${
        disabled || isLoading ? 'opacity-50' : ''
      }`}
      style={style}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={loaderColor} size="small" />
      ) : (
        <View className="flex-row items-center justify-center">
          {leftIcon && <View className="mr-2">{leftIcon}</View>}
          <Text className={`text-center ${getTextStyles()} ${getTextSize()}`}>{title}</Text>
          {rightIcon && <View className="ml-2">{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};
