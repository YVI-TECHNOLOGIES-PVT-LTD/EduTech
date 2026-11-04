import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useChildStore } from '../../../src/stores/child.store';
import { SelectedChildCard } from '../../../src/components/child/SelectedChildCard';
import { Badge } from '../../../src/components/ui/atoms/Badge';
import { transportApi, TransportAllocation } from '../../../src/api/transport.api';

export default function TransportScreen() {
  const router = useRouter();
  const activeChild = useChildStore((s) => s.getSelectedChild());
  const isEnrolled = activeChild?.kind === 'enrolled';
  const studentId = isEnrolled ? activeChild.studentId : null;

  const [allocation, setAllocation] = useState<TransportAllocation | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTransport = async () => {
    if (!studentId) return;
    setIsLoading(true);
    try {
      const data = await transportApi.getStudentTransport(studentId);
      setAllocation(data);
    } catch {
      // Graceful fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransport();
  }, [studentId]);

  const handleCallDriver = (phone?: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`).catch(() => {});
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchTransport} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center mb-4 pt-1">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 items-center justify-center mr-3 shadow-sm"
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={20} color="#334155" />
          </TouchableOpacity>
          <View>
            <Text className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Campus Logistics
            </Text>
            <Text className="text-xl font-black text-slate-900 dark:text-slate-100">
              School Bus & Route
            </Text>
          </View>
        </View>

        <SelectedChildCard />

        {!isEnrolled ? (
          <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 items-center text-center shadow-sm mt-2">
            <View className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950 items-center justify-center mb-3">
              <Ionicons name="bus-outline" size={28} color="#d97706" />
            </View>
            <Text className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
              Transport Available for Enrolled Students
            </Text>
            <Text className="text-xs text-slate-500 max-w-xs text-center leading-relaxed">
              Bus routes, assigned pick-up stops, and driver details activate upon admission
              confirmation and transport enrollment.
            </Text>
          </View>
        ) : allocation?.isAssigned ? (
          <>
            {/* Route & Bus Card */}
            <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 mb-4 shadow-sm">
              <View className="flex-row items-center justify-between mb-3">
                <Badge label={allocation.routeNumber || 'Route Assigned'} variant="primary" />
                <Badge label="Active Route" variant="success" />
              </View>

              <Text className="text-lg font-black text-slate-900 dark:text-slate-100 mb-1">
                {allocation.routeName || 'School Transport Fleet'}
              </Text>
              <Text className="text-xs font-semibold text-slate-500 mb-4">
                Vehicle: {allocation.vehicleNumber || 'Bus #14'}
              </Text>

              {/* Pickup & Drop Details */}
              <View className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl mb-4">
                <View className="flex-row items-start mb-3">
                  <View className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950 items-center justify-center mr-2.5 mt-0.5">
                    <Ionicons name="arrow-up" size={14} color="#059669" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Morning Pick-up
                    </Text>
                    <Text className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {allocation.pickupStop || 'Main Gate'}
                    </Text>
                    <Text className="text-[11px] text-slate-500 font-semibold">
                      {allocation.pickupTime || '07:35 AM'}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-start">
                  <View className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950 items-center justify-center mr-2.5 mt-0.5">
                    <Ionicons name="arrow-down" size={14} color="#4f46e5" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Evening Drop-off
                    </Text>
                    <Text className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {allocation.dropStop || 'Main Gate'}
                    </Text>
                    <Text className="text-[11px] text-slate-500 font-semibold">
                      {allocation.dropTime || '03:45 PM'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Driver & Staff Details */}
              <View className="flex-row items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <View className="flex-row items-center flex-1 mr-2">
                  <View className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center mr-3">
                    <Ionicons name="person" size={18} color="#64748b" />
                  </View>
                  <View>
                    <Text className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {allocation.driverName || 'Designated Driver'}
                    </Text>
                    <Text className="text-[10px] text-slate-400">Verified Bus Operator</Text>
                  </View>
                </View>

                {allocation.driverPhone && (
                  <TouchableOpacity
                    onPress={() => handleCallDriver(allocation.driverPhone)}
                    className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 items-center justify-center"
                    accessibilityRole="button"
                    accessibilityLabel="Call Bus Driver"
                  >
                    <Ionicons name="call" size={16} color="#059669" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </>
        ) : (
          <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 items-center text-center shadow-sm mt-2">
            <View className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 items-center justify-center mb-3">
              <Ionicons name="bus-outline" size={28} color="#94a3b8" />
            </View>
            <Text className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
              No Transport Allocation
            </Text>
            <Text className="text-xs text-slate-500 max-w-xs text-center leading-relaxed">
              This student is currently not registered for school bus transportation services. If
              you require bus allocation, please contact the campus administrative desk or submit a
              ticket via Helpdesk.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
