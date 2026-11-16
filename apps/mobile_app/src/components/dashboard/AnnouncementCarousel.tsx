import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ROUTES } from '../../constants/routes';

export interface AnnouncementItem {
  id: string;
  category: string;
  title: string;
  date: string;
  snippet: string;
}

export interface AnnouncementCarouselProps {
  announcements?: AnnouncementItem[];
}

export const AnnouncementCarousel: React.FC<AnnouncementCarouselProps> = ({
  announcements = [],
}) => {
  const router = useRouter();

  return (
    <View className="mb-6">
      <View className="flex-row items-center justify-between mb-3 px-1">
        <View className="flex-row items-center">
          <Ionicons name="megaphone-outline" size={16} color="#4f46e5" />
          <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1.5">
            School Announcements
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.push(ROUTES.MAIN.COMMUNICATION as any)}>
          <Text className="text-xs font-bold text-indigo-600 dark:text-indigo-400">View All</Text>
        </TouchableOpacity>
      </View>

      {announcements.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 16 }}
          className="flex-row"
        >
          {announcements.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.8}
              onPress={() => router.push(ROUTES.MAIN.COMMUNICATION as any)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mr-3 w-64 shadow-sm"
            >
              <View className="flex-row items-center justify-between mb-2">
                <View className="bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-900">
                  <Text className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                    {item.category}
                  </Text>
                </View>
                <Text className="text-[10px] font-medium text-slate-400">{item.date}</Text>
              </View>
              <Text
                className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-1"
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text className="text-[11px] text-slate-500 dark:text-slate-400" numberOfLines={2}>
                {item.snippet}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <View className="py-3 px-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Text className="text-xs text-slate-500 dark:text-slate-400">
            No active school circulars or announcements at this time.
          </Text>
        </View>
      )}
    </View>
  );
};
