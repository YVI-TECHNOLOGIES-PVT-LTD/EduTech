import React from 'react';
import { View, Text, Image } from 'react-native';

export interface AvatarProps {
  source?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showOnlineStatus?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  source,
  name = 'U',
  size = 'md',
  showOnlineStatus = false,
}) => {
  const getSizeStyle = () => {
    switch (size) {
      case 'sm':
        return 'w-9 h-9 text-xs';
      case 'lg':
        return 'w-14 h-14 text-lg';
      case 'xl':
        return 'w-20 h-20 text-2xl';
      case 'md':
      default:
        return 'w-11 h-11 text-sm';
    }
  };

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  return (
    <View className="relative">
      <View
        className={`rounded-full bg-indigo-600 border-2 border-white dark:border-slate-800 items-center justify-center overflow-hidden shadow-sm ${getSizeStyle()}`}
      >
        {source ? (
          <Image source={{ uri: source }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <Text className="font-extrabold text-white tracking-wider">{initials}</Text>
        )}
      </View>
      {showOnlineStatus && (
        <View className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
      )}
    </View>
  );
};
