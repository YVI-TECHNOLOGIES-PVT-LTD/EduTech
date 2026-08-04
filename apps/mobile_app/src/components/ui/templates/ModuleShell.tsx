import React from 'react';
import { View, Text } from 'react-native';
import { ScreenWrapper } from './ScreenWrapper';
import { SectionHeader } from '../molecules/SectionHeader';
import { Card } from '../organisms/Card';

export interface ModuleShellProps {
  moduleName: string;
  description: string;
  icon?: string;
  children?: React.ReactNode;
}

export const ModuleShell: React.FC<ModuleShellProps> = ({
  moduleName,
  description,
  icon = '📦',
  children,
}) => {
  return (
    <ScreenWrapper scrollable padded>
      <SectionHeader title={moduleName} subtitle={description} />
      <Card variant="gradient" className="items-center justify-center my-4 py-8">
        <View className="w-16 h-16 bg-white/20 rounded-2xl items-center justify-center mb-4">
          <Text className="text-3xl">{icon}</Text>
        </View>
        <Text className="text-xl font-extrabold text-white text-center mb-1">
          {moduleName} Active
        </Text>
        <Text className="text-xs text-indigo-100 text-center px-6 font-medium">
          Enterprise ERP module architecture integrated & operational.
        </Text>
      </Card>
      {children}
    </ScreenWrapper>
  );
};
