import React from 'react';
import { View, Text, StatusBar, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { ROUTES } from '../../src/constants/routes';

export default function SplashScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-[#3730a3]">
      <StatusBar barStyle="light-content" />
      
      {/* Background Royal Blue/Purple Gradient Overlay Container */}
      <View className="absolute inset-0 bg-[#312e81]">
        {/* Faint Background Line Illustration Accents */}
        <View className="absolute top-28 right-6 opacity-15">
          <Ionicons name="school-outline" size={140} color="#ffffff" />
        </View>
        <View className="absolute top-48 left-8 opacity-10">
          <Feather name="bar-chart-2" size={90} color="#ffffff" />
        </View>
        <View className="absolute bottom-60 right-10 opacity-10">
          <Ionicons name="book-outline" size={100} color="#ffffff" />
        </View>
      </View>

      <SafeAreaView className="flex-1 justify-between px-6 py-6 z-10">
        {/* Top Header Logo Bar */}
        <View className="items-center mt-6">
          <View className="flex-row items-center justify-center">
            <View className="w-12 h-12 bg-white/10 rounded-2xl items-center justify-center mr-3 border border-white/20">
              <Ionicons name="school" size={28} color="#ffffff" />
            </View>
            <View>
              <Text className="text-2xl font-black text-white tracking-tight">
                EduTrack
              </Text>
              <Text className="text-xs font-semibold text-indigo-200 tracking-wider">
                School ERP
              </Text>
            </View>
          </View>
        </View>

        {/* Faint School Building Line Illustration Centerpiece */}
        <View className="items-center justify-center my-auto opacity-20">
          <Ionicons name="business-outline" size={180} color="#ffffff" />
        </View>

        {/* Bottom Hero Typography & CTA Button */}
        <View className="w-full pb-6">
          <Text className="text-4xl font-extrabold text-white leading-tight tracking-tight mb-3">
            Empowering{'\n'}Education,{'\n'}Enriching Futures
          </Text>

          <Text className="text-sm font-medium text-indigo-100/90 leading-relaxed mb-8 max-w-sm">
            A complete school management solution for students, teachers, parents and administrators.
          </Text>

          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => router.push(ROUTES.AUTH.LOGIN as any)}
            className="w-full bg-[#1e1b4b] border border-white/10 py-4 px-6 rounded-full flex-row items-center justify-center shadow-2xl shadow-black/40"
          >
            <Text className="text-base font-bold text-white mr-2">Get Started!</Text>
            <Ionicons name="arrow-forward" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}
