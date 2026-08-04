import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../src/components/ui/templates/ScreenWrapper';
import { Button } from '../../src/components/ui/atoms/Button';
import { Badge } from '../../src/components/ui/atoms/Badge';
import { ROUTES } from '../../src/constants/routes';
import { TenantService } from '../../src/core/tenant/tenant.service';

const mockWorkspaces = [
  {
    id: 'tnt_1',
    name: 'Springfield International Academy',
    code: 'SIA-MAIN',
    branch: 'Main Campus',
    schoolId: 'sch_1',
    academicYearId: 'ay_2026',
    yearName: 'AY 2026-2027',
    icon: '🏫',
  },
  {
    id: 'tnt_2',
    name: 'St. Jude Grammar School',
    code: 'SJA-NORTH',
    branch: 'North Wing Branch',
    schoolId: 'sch_2',
    academicYearId: 'ay_2026',
    yearName: 'AY 2026-2027',
    icon: '📚',
  },
];

export default function WorkspaceSelectionScreen() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(mockWorkspaces[0].id);

  const handleSelectWorkspace = async () => {
    const ws = mockWorkspaces.find((w) => w.id === selectedId) || mockWorkspaces[0];
    await TenantService.selectWorkspace(ws);
    router.replace(ROUTES.TABS.DASHBOARD as any);
  };

  return (
    <ScreenWrapper scrollable padded>
      <View className="py-6">
        {/* Header Title */}
        <View className="mb-6">
          <Badge label="Multi-Tenant Platform" variant="primary" />
          <Text className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-2 mb-1">
            Select Workspace
          </Text>
          <Text className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Choose an active school institution & branch workspace to manage
          </Text>
        </View>

        {/* Workspace Cards */}
        {mockWorkspaces.map((ws) => {
          const isSelected = selectedId === ws.id;
          return (
            <TouchableOpacity
              key={ws.id}
              activeOpacity={0.88}
              onPress={() => setSelectedId(ws.id)}
              className={`p-5 rounded-3xl mb-4 border transition-all ${
                isSelected
                  ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-600 shadow-md shadow-indigo-500/10'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm'
              }`}
            >
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center flex-1 mr-2">
                  <View className="w-12 h-12 bg-indigo-600/10 dark:bg-indigo-500/20 rounded-2xl items-center justify-center mr-3">
                    <Text className="text-2xl">{ws.icon}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                      {ws.name}
                    </Text>
                    <Text className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                      {ws.branch} • {ws.code}
                    </Text>
                  </View>
                </View>

                {isSelected ? (
                  <View className="w-7 h-7 bg-indigo-600 rounded-full items-center justify-center">
                    <Text className="text-white font-bold text-xs">✓</Text>
                  </View>
                ) : (
                  <View className="w-7 h-7 rounded-full border border-slate-300 dark:border-slate-600" />
                )}
              </View>

              <View className="flex-row items-center justify-between pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                <Text className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Academic Period
                </Text>
                <Badge label={ws.yearName} variant="info" />
              </View>
            </TouchableOpacity>
          );
        })}

        <View className="mt-6">
          <Button title="Enter Workspace" size="lg" onPress={handleSelectWorkspace} />
        </View>
      </View>
    </ScreenWrapper>
  );
}
